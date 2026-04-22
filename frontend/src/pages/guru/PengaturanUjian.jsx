import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings2, Download, RefreshCw, CheckCircle2, XCircle, Table, PlusCircle, Trash2, Code, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PengaturanUjian() {
  const [pengaturan, setPengaturan] = useState({ pretest_aktif: false, posttest_aktif: false });
  const [rekapNilai, setRekapNilai] = useState([]);
  
  // STATE: Analisis Soal
  const [analisisSoal, setAnalisisSoal] = useState({ data: [], daftar_soal: [] });
  const [tipeAnalisis, setTipeAnalisis] = useState('pretest'); 
  
  // STATE BARU: Bank Soal & Form Tambah
  const [daftarBankSoal, setDaftarBankSoal] = useState([]);
  const [tipeBankSoal, setTipeBankSoal] = useState('pretest');
  const [showFormTambah, setShowFormTambah] = useState(false);
  
  // PERBAIKAN: State Form disederhanakan tanpa toggle isCode
  const [formSoal, setFormSoal] = useState({
    pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', opsi_e: '', jawaban_benar: 'A'
  });

  const [activeTab, setActiveTab] = useState('rekap'); 
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPengaturan, resRekap, resAnalisis, resBank] = await Promise.all([
        axios.get('http://localhost:8000/api/pengaturan-ujian'),
        axios.get('http://localhost:8000/api/guru/hasil-ujian-rekap'),
        axios.get(`http://localhost:8000/api/guru/analisis-soal/${tipeAnalisis}`),
        axios.get(`http://localhost:8000/api/soal-ujian/${tipeBankSoal}`)
      ]);

      if (resPengaturan.data.status === 'success' && resPengaturan.data.data) {
        setPengaturan(resPengaturan.data.data);
      }
      if (resRekap.data.status === 'success') {
        setRekapNilai(resRekap.data.data);
      }
      if (resAnalisis.data.status === 'success') {
        setAnalisisSoal({ data: resAnalisis.data.data, daftar_soal: resAnalisis.data.daftar_soal });
      }
      if (resBank.data.status === 'success') {
        setDaftarBankSoal(resBank.data.data);
      }
    } catch (error) {
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tipeAnalisis, tipeBankSoal]);

  const handleToggle = async (tipe) => {
    const nilaiBaru = !pengaturan[tipe];
    const dataUpdate = { ...pengaturan, [tipe]: nilaiBaru };
    setPengaturan(dataUpdate);

    try {
      await axios.post('http://localhost:8000/api/guru/pengaturan-ujian', dataUpdate);
      toast.success(`${tipe === 'pretest_aktif' ? 'Pre-Test' : 'Post-Test'} berhasil ${nilaiBaru ? 'Diaktifkan' : 'Dimatikan'}`);
    } catch (error) {
      setPengaturan({ ...pengaturan, [tipe]: !nilaiBaru });
      toast.error("Gagal menyimpan pengaturan.");
    }
  };

  // ==========================================
  // HANDLER DOWNLOAD CSV
  // ==========================================
  const handleDownloadCSV = () => {
    if (rekapNilai.length === 0) {
      toast.error("Belum ada data nilai untuk diunduh.");
      return;
    }
    let csvContent = "Nama Siswa,Kelas,Nilai Pre-Test,Nilai Post-Test\n";
    rekapNilai.forEach(row => {
      const pre = row.nilai_pretest !== null ? row.nilai_pretest : '';
      const post = row.nilai_posttest !== null ? row.nilai_posttest : '';
      csvContent += `"${row.nama}","${row.kelas}",${pre},${post}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Nilai_AutoFeed_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleDownloadAnalisisCSV = () => {
    if (analisisSoal.data.length === 0) {
      toast.error("Belum ada data analisis untuk diunduh.");
      return;
    }
    const headers = ["No", "Nama Siswa", "Kelas", "Total Skor", ...analisisSoal.daftar_soal.map((_, i) => `Soal ${i + 1}`)];
    let csvContent = headers.join(",") + "\n";
    analisisSoal.data.forEach((row, index) => {
      const rowData = [index + 1, `"${row.nama}"`, `"${row.kelas}"`, row.skor_total];
      analisisSoal.daftar_soal.forEach(soalId => rowData.push(row[`soal_${soalId}`]));
      csvContent += rowData.join(",") + "\n";
    });
    const rowTotal = ["", `"TOTAL BENAR"`, '""', '""'];
    analisisSoal.daftar_soal.forEach(soalId => {
      const totalBenar = analisisSoal.data.reduce((sum, row) => sum + (row[`soal_${soalId}`] === 1 ? 1 : 0), 0);
      rowTotal.push(totalBenar);
    });
    csvContent += rowTotal.join(",") + "\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Analisis_Soal_${tipeAnalisis.toUpperCase()}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const hitungTotalBenarPerSoal = (soalId) => {
    return analisisSoal.data.reduce((total, row) => total + (row[`soal_${soalId}`] === 1 ? 1 : 0), 0);
  };

  // ==========================================
  // HANDLER BANK SOAL
  // ==========================================
  const handleSimpanSoal = async (e) => {
    e.preventDefault();
    
    // PERBAIKAN: Payload langsung dikirim karena backticks disisipkan manual oleh user
    const payload = {
      tipe_ujian: tipeBankSoal,
      pertanyaan: formSoal.pertanyaan,
      opsi_a: formSoal.opsi_a,
      opsi_b: formSoal.opsi_b,
      opsi_c: formSoal.opsi_c,
      opsi_d: formSoal.opsi_d,
      opsi_e: formSoal.opsi_e,
      jawaban_benar: formSoal.jawaban_benar
    };

    try {
      const res = await axios.post('http://localhost:8000/api/guru/soal-ujian', payload);
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        setShowFormTambah(false);
        setFormSoal({ pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', opsi_e: '', jawaban_benar: 'A' });
        fetchData(); 
      }
    } catch (err) {
      toast.error("Gagal menyimpan soal.");
    }
  };

  const handleHapusSoal = async (id) => {
    if(window.confirm("Yakin ingin menghapus soal ini?")) {
      try {
        await axios.delete(`http://localhost:8000/api/guru/soal-ujian/${id}`);
        toast.success("Soal berhasil dihapus!");
        fetchData();
      } catch (err) {
        toast.error("Gagal menghapus soal.");
      }
    }
  };

  // PERBAIKAN: Fungsi sisip kode ke dalam teks yang sedang diketik
  const sisipkanKode = (fieldName) => {
    const blokKodeBaru = "\n```python\n# Ketik kode di sini...\n```\n";
    setFormSoal({ ...formSoal, [fieldName]: formSoal[fieldName] + blokKodeBaru });
  };

  // PERBAIKAN: Ini bukan komponen <InputDinamis/> lagi, melainkan fungsi render biasa 
  // agar React tidak membuang fokus kursor setiap kali kita mengetik.
  const renderInputArea = (label, fieldName, rows = 2) => {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="font-bold text-sm text-slate-700">{label}</label>
          <button 
            type="button" 
            onClick={() => sisipkanKode(fieldName)} 
            className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border border-slate-200 shadow-sm"
          >
            <Code size={14}/> Sisipkan Blok Kode
          </button>
        </div>
        <textarea 
          required 
          rows={rows}
          className="w-full border border-slate-300 p-3.5 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all bg-white text-slate-800 text-sm leading-relaxed"
          placeholder="Ketik teks kalimat atau kode di sini..."
          value={formSoal[fieldName]}
          onChange={(e) => setFormSoal({...formSoal, [fieldName]: e.target.value})}
        />
      </div>
    );
  };

  if (loading && rekapNilai.length === 0) {
    return <div className="p-10 flex justify-center text-slate-500"><RefreshCw className="animate-spin mr-2" /> Memuat Pengaturan...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      
      <div className="bg-white/50 dark:bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/60 dark:border-white/10 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Settings2 className="text-blue-500" /> Kontrol Ujian
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-2">Aktifkan Pre-Test atau Post-Test agar muncul di menu Siswa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl border border-white/80 dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-bold mb-2">Akses Pre-Test</h3>
          <p className="text-sm text-slate-500 mb-6">Siswa baru bisa mengerjakan Pre-Test jika saklar ini dihidupkan.</p>
          <button onClick={() => handleToggle('pretest_aktif')} className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 ${pengaturan.pretest_aktif ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`${pengaturan.pretest_aktif ? 'translate-x-12 bg-white' : 'translate-x-1 bg-white'} h-10 w-10 transform rounded-full transition-transform duration-300 shadow-md flex items-center justify-center`}>
               {pengaturan.pretest_aktif ? <CheckCircle2 size={24} className="text-blue-600" /> : <XCircle size={24} className="text-slate-400" />}
            </span>
          </button>
          <span className={`mt-4 font-black tracking-widest uppercase text-sm ${pengaturan.pretest_aktif ? 'text-blue-600' : 'text-slate-400'}`}>{pengaturan.pretest_aktif ? 'STATUS: MENYALA' : 'STATUS: MATI'}</span>
        </div>

        <div className="bg-white/60 dark:bg-slate-800/60 p-8 rounded-3xl border border-white/80 dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-xl font-bold mb-2">Akses Post-Test</h3>
          <p className="text-sm text-slate-500 mb-6">Nyalakan saklar ini hanya setelah siswa selesai semua materi PBL.</p>
          <button onClick={() => handleToggle('posttest_aktif')} className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-300 ${pengaturan.posttest_aktif ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
            <span className={`${pengaturan.posttest_aktif ? 'translate-x-12 bg-white' : 'translate-x-1 bg-white'} h-10 w-10 transform rounded-full transition-transform duration-300 shadow-md flex items-center justify-center`}>
               {pengaturan.posttest_aktif ? <CheckCircle2 size={24} className="text-emerald-500" /> : <XCircle size={24} className="text-slate-400" />}
            </span>
          </button>
          <span className={`mt-4 font-black tracking-widest uppercase text-sm ${pengaturan.posttest_aktif ? 'text-emerald-500' : 'text-slate-400'}`}>{pengaturan.posttest_aktif ? 'STATUS: MENYALA' : 'STATUS: MATI'}</span>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 rounded-3xl border border-white/80 dark:border-white/10 overflow-hidden shadow-sm mt-10">
        <div className="flex flex-col md:flex-row border-b border-slate-200 dark:border-white/10">
          <button onClick={() => setActiveTab('rekap')} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'rekap' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            Rekap Nilai Siswa
          </button>
          <button onClick={() => setActiveTab('analisis')} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'analisis' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            Analisis Butir Soal
          </button>
          <button onClick={() => setActiveTab('bank')} className={`flex-1 py-4 font-bold text-center transition-colors ${activeTab === 'bank' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-slate-500 hover:bg-purple-50'}`}>
            Bank Soal Ujian
          </button>
        </div>

        {/* TAB 1: REKAP */}
        {activeTab === 'rekap' && (
          <div className="animate-fade-in">
            <div className="p-6 md:px-8 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-black">Data Nilai Akhir</h2>
              <button onClick={handleDownloadCSV} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-900 shadow-sm">
                <Download size={18} /> Export Rekap (CSV)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100/50 dark:bg-black/20 text-slate-500 text-xs uppercase font-black">
                  <tr><th className="px-8 py-4">Nama Siswa</th><th className="px-8 py-4">Kelas</th><th className="px-8 py-4 text-center">Nilai Pre-Test</th><th className="px-8 py-4 text-center">Nilai Post-Test</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                  {rekapNilai.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-slate-500">Belum ada data nilai.</td></tr> : rekapNilai.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/40">
                      <td className="px-8 py-5 font-bold">{row.nama}</td><td className="px-8 py-5 text-slate-600 text-sm">{row.kelas}</td>
                      <td className="px-8 py-5 text-center">{row.nilai_pretest !== null ? <span className="inline-block bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg">{row.nilai_pretest}</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="px-8 py-5 text-center">{row.nilai_posttest !== null ? <span className="inline-block bg-emerald-100 text-emerald-700 font-black px-3 py-1 rounded-lg">{row.nilai_posttest}</span> : <span className="text-slate-400">-</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ANALISIS */}
        {activeTab === 'analisis' && (
          <div className="animate-fade-in">
            <div className="p-6 md:px-8 border-b border-slate-200 dark:border-white/10 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black">Matriks Uji: </h2>
                <select value={tipeAnalisis} onChange={(e) => setTipeAnalisis(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="pretest">Data Pre-Test</option>
                  <option value="posttest">Data Post-Test</option>
                </select>
                <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200"><Table size={16}/> 1 = Benar, 0 = Salah</div>
              </div>
              <button onClick={handleDownloadAnalisisCSV} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition-colors">
                <Download size={18} /> Export Analisis (CSV)
              </button>
            </div>

            <div className="overflow-x-auto relative max-h-[600px]">
              <table className="w-full text-left min-w-max border-collapse">
                <thead className="bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 border-b border-r border-slate-200 w-10 text-center bg-slate-100">No</th>
                    <th className="px-6 py-4 border-b border-r border-slate-200 bg-slate-100 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Siswa</th>
                    <th className="px-6 py-4 border-b border-r border-slate-200 bg-slate-100 text-center">Skor Total</th>
                    {analisisSoal.daftar_soal.map((soalId, i) => (
                      <th key={soalId} className="px-4 py-4 border-b border-r border-slate-200 text-center min-w-[60px] bg-indigo-50 text-indigo-700">Soal<br/>{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {analisisSoal.data.length === 0 ? (
                    <tr><td colSpan={3 + analisisSoal.daftar_soal.length} className="p-10 text-center text-slate-500">Belum ada siswa yang menyelesaikan {tipeAnalisis}.</td></tr>
                  ) : (
                    analisisSoal.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-3 border-r border-slate-200 text-center text-sm font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-3 border-r border-slate-200 font-bold text-slate-800 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {row.nama} <span className="block text-xs font-normal text-slate-500">{row.kelas}</span>
                        </td>
                        <td className="px-6 py-3 border-r border-slate-200 text-center font-black text-blue-600">{row.skor_total}</td>
                        {analisisSoal.daftar_soal.map(soalId => {
                          const nilai = row[`soal_${soalId}`];
                          return (
                            <td key={soalId} className={`px-4 py-3 border-r border-slate-200 text-center font-black ${nilai === 1 ? 'text-emerald-500 bg-emerald-50/30' : nilai === 0 ? 'text-red-500 bg-red-50/30' : 'text-slate-300'}`}>
                              {nilai}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                  {analisisSoal.data.length > 0 && (
                     <tr className="bg-slate-800 text-white font-black sticky bottom-0 z-20">
                        <td colSpan="3" className="px-6 py-4 text-right border-r border-slate-700 tracking-wider">TOTAL JAWABAN BENAR :</td>
                        {analisisSoal.daftar_soal.map(soalId => (
                          <td key={`total_${soalId}`} className="px-4 py-4 text-center border-r border-slate-700 bg-slate-900 text-emerald-400">
                             {hitungTotalBenarPerSoal(soalId)}
                          </td>
                        ))}
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BANK SOAL */}
        {activeTab === 'bank' && (
          <div className="p-6 md:p-8 animate-fade-in bg-slate-50/30">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-black text-purple-900">Kelola Bank Soal: </h2>
                <select 
                  value={tipeBankSoal} 
                  onChange={(e) => setTipeBankSoal(e.target.value)} 
                  className="bg-white border-2 border-purple-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none focus:border-purple-500 shadow-sm"
                >
                  <option value="pretest">Ujian Pre-Test</option>
                  <option value="posttest">Ujian Post-Test</option>
                </select>
              </div>
              <button 
                onClick={() => setShowFormTambah(!showFormTambah)} 
                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition shadow-md shadow-purple-200"
              >
                {showFormTambah ? <XCircle size={18}/> : <PlusCircle size={18}/>}
                {showFormTambah ? "Batal Tambah" : "Tambah Soal Baru"}
              </button>
            </div>

            {showFormTambah && (
              <form onSubmit={handleSimpanSoal} className="bg-white border-2 border-purple-100 p-8 rounded-3xl shadow-md mb-10">
                <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-slate-800"><PenTool className="text-purple-500"/> Buat Soal Baru</h3>
                
                {renderInputArea("Pertanyaan Utama:", "pertanyaan", 4)}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   {renderInputArea("Opsi A:", "opsi_a", 2)}
                   {renderInputArea("Opsi B:", "opsi_b", 2)}
                   {renderInputArea("Opsi C:", "opsi_c", 2)}
                   {renderInputArea("Opsi D:", "opsi_d", 2)}
                   <div className="md:col-span-2">{renderInputArea("Opsi E:", "opsi_e", 2)}</div>
                </div>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <label className="font-bold text-sm block mb-3 text-slate-700">Kunci Jawaban Benar:</label>
                  <select 
                    required 
                    value={formSoal.jawaban_benar} 
                    onChange={(e) => setFormSoal({...formSoal, jawaban_benar: e.target.value})} 
                    className="border-2 border-emerald-200 bg-emerald-50 text-emerald-800 font-black rounded-xl px-6 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all"
                  >
                    <option value="A">Opsi A</option>
                    <option value="B">Opsi B</option>
                    <option value="C">Opsi C</option>
                    <option value="D">Opsi D</option>
                    <option value="E">Opsi E</option>
                  </select>
                </div>

                <button type="submit" className="w-full mt-10 bg-purple-600 text-white font-black py-4 rounded-2xl hover:bg-purple-700 transition shadow-xl shadow-purple-200 flex justify-center items-center gap-2">
                  <CheckCircle2 /> Simpan ke Bank Soal
                </button>
              </form>
            )}

            <div className="space-y-4">
              {daftarBankSoal.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-3xl text-slate-500 border-2 border-dashed border-slate-200">Belum ada soal untuk {tipeBankSoal}.</div>
              ) : (
                daftarBankSoal.map((soal, idx) => (
                  <div key={soal.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row gap-5 hover:border-purple-300 transition-all group">
                    <div className="w-12 h-12 shrink-0 bg-slate-100 font-black text-lg rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                        {soal.pertanyaan}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs font-bold mb-3">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">Kunci: {soal.jawaban_benar}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleHapusSoal(soal.id)} 
                      className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 p-3 rounded-2xl transition self-start border border-transparent hover:border-red-200" 
                      title="Hapus Soal"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}