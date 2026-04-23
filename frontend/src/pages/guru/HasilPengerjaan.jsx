import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users, ChevronRight, CheckCircle2, Code, MessageSquare, RefreshCw, X, History, Sparkles, Filter, ChevronDown } from 'lucide-react';

export default function HasilPengerjaan() {
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Filter & Pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModul, setSelectedModul] = useState(1); // Default ke Pertemuan 1
  
  // State untuk Detail Modal & Data Portofolio
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailPortofolio, setDetailPortofolio] = useState([]);

  // 1. Fungsi mengambil data tabel utama dari Database
  const fetchData = async () => {
    setLoading(true);
    try {
      // Endpoint ini mengambil seluruh log riwayat
      const res = await axios.get('https://autofeed.my.id/api/guru/riwayat');
      if (res.data.status === 'success') {
        setDataRiwayat(res.data.data);
      }
    } catch (err) { 
      console.error(err); 
      // Fallback Simulasi jika backend belum siap / error
      setDataRiwayat([
        { user_id: 1, nama_siswa: 'Sifa Fauzan', kelas: 'X PPLG 1', modul_id: 1, fase: 4, percobaan_ke: 2 },
        { user_id: 1, nama_siswa: 'Sifa Fauzan', kelas: 'X PPLG 1', modul_id: 1, fase: 3, percobaan_ke: 1 },
        { user_id: 2, nama_siswa: 'Budi Santoso', kelas: 'X PPLG 1', modul_id: 1, fase: 5, percobaan_ke: 1 },
        { user_id: 1, nama_siswa: 'Sifa Fauzan', kelas: 'X PPLG 1', modul_id: 2, fase: 2, percobaan_ke: 3 },
      ]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // 2. LOGIKA PENGELOMPOKAN (GROUPING) & FILTERING
  const processFilteredData = () => {
    // A. Filter berdasarkan Modul/Pertemuan yang dipilih
    const filteredByModul = dataRiwayat.filter(item => (item.modul_id || 1) === selectedModul);

    // B. Kelompokkan agar 1 Siswa hanya muncul 1 baris (Ambil fase tertingginya)
    const uniqueStudentsMap = new Map();
    filteredByModul.forEach(item => {
      // Gunakan user_id sebagai kunci unik, atau nama jika user_id tidak ada
      const key = item.user_id || item.nama_siswa; 
      const existing = uniqueStudentsMap.get(key);
      
      // Jika siswa belum masuk daftar, atau siswa ini punya fase yang lebih tinggi dari sebelumnya
      if (!existing || item.fase > existing.fase || (item.fase === existing.fase && item.percobaan_ke > existing.percobaan_ke)) {
        uniqueStudentsMap.set(key, item);
      }
    });

    // C. Ubah Map kembali menjadi Array, lalu terapkan fitur Pencarian (Search)
    const uniqueArray = Array.from(uniqueStudentsMap.values());
    return uniqueArray.filter(item => 
      item.nama_siswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kelas || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const dataTampil = processFilteredData();

  // 3. Fungsi mengambil data RANGKUMAN FULL 5 FASE
  const bukaDetailPortofolio = async (siswa) => {
    setSelectedSiswa(siswa);
    setIsModalOpen(true);
    setLoadingDetail(true);
    
    try {
      // Meminta riwayat lengkap dari backend
      const res = await axios.get(`https://autofeed.my.id/api/guru/portofolio/${siswa.user_id}/${selectedModul}`);
      
      if (res.data.status === 'success') {
        setDetailPortofolio(res.data.data); // Murni mengambil dari database!
      } else {
        setDetailPortofolio([]);
      }
    } catch (err) {
      console.error("Gagal menarik data portofolio:", err);
      // Mode simulasi sudah dihapus. Jika backend gagal, array dikosongkan.
      setDetailPortofolio([]); 
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatBintang = (teks) => {
    if (!teks) return "-";
    const parts = teks.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => part.startsWith('**') ? <strong key={i} className="text-blue-600 dark:text-blue-400">{part.slice(2, -2)}</strong> : part);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Header Halaman */}
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-white/10 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-black dark:text-white flex items-center gap-3">
            <Users className="text-blue-500" /> Hasil PBL Siswa
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Pantau progres dan jalan pikiran setiap siswa secara mendalam.</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white/50 dark:bg-white/10 border border-white/50 dark:border-white/10 shadow-sm rounded-xl hover:bg-white/80 transition-all duration-300 group">
          <RefreshCw size={20} className={`text-slate-600 dark:text-slate-300 group-hover:text-blue-500 ${loading ? "animate-spin text-blue-500" : ""}`} />
        </button>
      </div>

      {/* Bar Pencarian & Filter Modul */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Kolom Pencarian */}
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama siswa atau kelas..." 
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-medium dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdown Pemilihan Pertemuan/Modul */}
        <div className="relative w-full md:w-64 shrink-0">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg pointer-events-none">
            <Filter size={16} />
          </div>
          <select 
            value={selectedModul}
            onChange={(e) => setSelectedModul(Number(e.target.value))}
            className="w-full appearance-none pl-14 pr-10 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value={1}>Pertemuan 1</option>
            <option value={2}>Pertemuan 2</option>
            <option value={3}>Pertemuan 3</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Tabel Utama */}
      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50/50 dark:bg-black/20 text-slate-500 dark:text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-5">Identitas Siswa</th>
                <th className="px-6 py-5 text-center">Progres Terkini (Modul {selectedModul})</th>
                <th className="px-6 py-5">Status Terakhir</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan="4" className="p-20 text-center font-bold text-slate-400"><RefreshCw className="animate-spin inline-block mr-2"/> Memuat data riwayat...</td></tr>
              ) : dataTampil.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-slate-500 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/60 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 border border-slate-200 dark:border-white/10">
                      <Users size={28} className="text-slate-400" />
                    </div>
                    <span className="font-bold">Belum Ada Pengerjaan</span>
                    <span className="text-sm mt-1">Belum ada siswa yang mengerjakan PBL pada Pertemuan {selectedModul}.</span>
                  </td>
                </tr>
              ) : (
                dataTampil.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 dark:text-white">{item.nama_siswa}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{item.kelas || 'Siswa PBL'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-1.5">
                        {/* Visualisasi 5 Bulatan Fase Manual */}
                        <div className={`w-3 h-3 rounded-full ${item.fase >= 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} title="Fase 1" />
                        <div className={`w-3 h-3 rounded-full ${item.fase >= 2 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} title="Fase 2" />
                        <div className={`w-3 h-3 rounded-full ${item.fase >= 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} title="Fase 3" />
                        <div className={`w-3 h-3 rounded-full ${item.fase >= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} title="Fase 4" />
                        <div className={`w-3 h-3 rounded-full ${item.fase >= 5 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} title="Fase 5" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/50">Fase {item.fase}</span>
                        <span>Percobaan ke-{item.percobaan_ke}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => bukaDetailPortofolio(item)}
                        className="inline-flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-400 transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Buka Rangkuman <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

{/* ======================================================= */}
{/* MODAL DETAIL PORTOFOLIO (LINEAR & CENTERED OFFSET) */}
{/* ======================================================= */}
{isModalOpen && selectedSiswa && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-fade-in md:pl-72"> 
    {/* md:pl-72 di atas berfungsi menggeser titik tengah modal agar rata tengah di area konten (asumsi lebar navbar/sidebar +/- 280px) */}
    
    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
      
      {/* Modal Header */}
      <div className="p-6 md:p-10 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center shrink-0">
        <div className="flex gap-5 items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-3xl font-black shadow-inner">
            {selectedSiswa.nama_siswa.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{selectedSiswa.nama_siswa}</h2>
            <p className="text-indigo-100 text-sm md:text-base font-medium flex items-center gap-2 mt-1 opacity-90">
              <History size={16} /> Rangkuman Perjalanan PBL • Pertemuan {selectedModul}
            </p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-transparent hover:border-white/30 active:scale-95">
          <X size={28} />
        </button>
      </div>

      {/* Modal Content - Linear Timeline Style */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 dark:bg-[#0B0F19]">
        {loadingDetail ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-500">
            <RefreshCw size={44} className="animate-spin" />
            <p className="font-bold text-lg">Menarik rekaman portofolio...</p>
          </div>
        ) : detailPortofolio.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-medium">Belum ada riwayat pengerjaan yang tersimpan.</div>
        ) : (
          /* Garis Vertikal Timeline di Sisi Kiri */
          <div className="space-y-12 relative before:absolute before:inset-0 before:left-6 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-blue-500 before:to-emerald-500">
            
            {detailPortofolio.map((data, index) => (
              <div key={index} className="relative pl-16 group">
                
                {/* Bulatan Angka Fase */}
                <div className="absolute left-1 top-0 flex items-center justify-center w-11 h-11 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-600 text-white font-black text-sm shadow-lg z-10">
                  {data.fase}
                </div>

                {/* Kotak Konten (Linear) */}
                <div className="w-full p-6 md:p-8 rounded-[2rem] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                  
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-slate-800 dark:text-white text-lg">Catatan Fase {data.fase}</h3>
                      <span className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-lg tracking-widest border border-slate-200 dark:border-white/10">
                        {data.tipe === 'kode' ? '📝 Python Code' : '💬 Teks Verbal'}
                      </span>
                    </div>
                  </div>

                  {/* Input Hasil Kerja Siswa */}
                  <div className="mb-6">
                    {data.tipe === 'kode' ? (
                      <div className="bg-[#0d1117] rounded-2xl overflow-hidden border border-slate-700/50">
                        <div className="bg-black/40 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                          <Code size={14} className="text-emerald-400"/> 
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Sintaks</span>
                        </div>
                        <pre className="p-5 text-emerald-300 font-mono text-sm overflow-x-auto whitespace-pre">
                          <code>{data.input_kode}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed italic">
                        "{data.input_verbal}"
                      </div>
                    )}
                  </div>

                  {/* Box Evaluasi AI */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-6 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 w-full overflow-hidden">
                    <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="shrink-0" /> Umpan Balik AI
                    </h4>
                    <p className="text-indigo-950 dark:text-indigo-100/90 text-sm md:text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                      {formatBintang(data.feedback_ai)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-5 text-center border-t border-slate-200 dark:border-white/10 shrink-0">
         <p className="text-[11px] text-slate-500 font-bold tracking-wide uppercase">Rangkuman ini mencatat hasil pengerjaan terbaik pada setiap fase.</p>
      </div>
    </div>
  </div>
)}
    </div>
  );
}