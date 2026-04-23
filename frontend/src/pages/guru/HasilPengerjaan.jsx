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
      const res = await axios.get('http://autofeed.my.id/api/guru/riwayat');
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
      const res = await axios.get(`http://autofeed.my.id/api/guru/portofolio/${siswa.user_id}/${selectedModul}`);
      
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
      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 overflow-hidden shadow-sm mt-6">
        
        {/* Header Desktop (Otomatis Sembunyi di Layar HP) */}
        <div className="hidden md:grid grid-cols-4 gap-4 bg-slate-50/50 dark:bg-black/20 text-slate-500 dark:text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-100 dark:border-white/5 px-6 py-5">
          <div>Identitas Siswa</div>
          <div className="text-center">Progres (Modul {selectedModul})</div>
          <div>Status Terakhir</div>
          <div className="text-right">Aksi</div>
        </div>

        {/* Isi Daftar Siswa */}
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {loading ? (
            <div className="p-20 text-center font-bold text-slate-400"><RefreshCw className="animate-spin inline-block mr-2"/> Memuat data riwayat...</div>
          ) : dataTampil.length === 0 ? (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/60 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 border border-slate-200 dark:border-white/10">
                <Users size={28} className="text-slate-400" />
              </div>
              <span className="font-bold text-lg">Belum Ada Pengerjaan</span>
              <span className="text-sm mt-1">Belum ada siswa yang mengerjakan PBL pada Pertemuan {selectedModul}.</span>
            </div>
          ) : (
            dataTampil.map((item, idx) => (
              <div key={idx} className="flex flex-col md:grid md:grid-cols-4 md:items-center gap-4 md:gap-4 p-5 md:px-6 hover:bg-white/60 dark:hover:bg-white/10 transition-colors group">
                
                {/* 1. Identitas & Status Mobile */}
                <div className="flex justify-between items-start md:block">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-lg md:text-base">{item.nama_siswa}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{item.kelas || 'Siswa PBL'}</div>
                  </div>
                  {/* Badge Fase Khusus Muncul di HP */}
                  <div className="md:hidden flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/50 text-xs font-bold shadow-sm">
                    Fase {item.fase}
                  </div>
                </div>

                {/* 2. Visualisasi Fase (5 Bulatan) */}
                <div className="flex items-center gap-3 md:justify-center bg-slate-50/50 md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-100 md:border-transparent">
                  <span className="md:hidden text-xs font-bold text-slate-500">Progres Fase:</span>
                  <div className="flex gap-1.5">
                    <div className={`w-3.5 h-3.5 md:w-3 md:h-3 rounded-full ${item.fase >= 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    <div className={`w-3.5 h-3.5 md:w-3 md:h-3 rounded-full ${item.fase >= 2 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    <div className={`w-3.5 h-3.5 md:w-3 md:h-3 rounded-full ${item.fase >= 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    <div className={`w-3.5 h-3.5 md:w-3 md:h-3 rounded-full ${item.fase >= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    <div className={`w-3.5 h-3.5 md:w-3 md:h-3 rounded-full ${item.fase >= 5 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  </div>
                </div>

                {/* 3. Status Terakhir Desktop (Sembunyi di HP karena sudah ada di atas) */}
                <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/50">Fase {item.fase}</span>
                  <span>Ke-{item.percobaan_ke}</span>
                </div>

                {/* 4. Tombol Aksi */}
                <div className="mt-2 md:mt-0 flex md:justify-end">
                  <button 
                    onClick={() => bukaDetailPortofolio(item)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-5 py-3 md:px-4 md:py-2.5 rounded-xl text-sm md:text-xs font-bold hover:bg-blue-700 dark:hover:bg-blue-400 transition-all shadow-md shadow-blue-500/20 active:translate-y-0.5"
                  >
                    Buka Rangkuman <ChevronRight size={16} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL DETAIL PORTOFOLIO (FULL 5 FASE) */}
      {/* ======================================================= */}
      {isModalOpen && selectedSiswa && (
        <div className="fixed inset-0 z- flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-2xl font-black shadow-inner">
                  {selectedSiswa.nama_siswa.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">{selectedSiswa.nama_siswa}</h2>
                  <p className="text-blue-100 text-sm font-medium flex items-center gap-2 mt-0.5">
                    <History size={14} /> Portofolio PBL • Pertemuan {selectedModul}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-transparent hover:border-white/30">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content - List Fase Berurutan */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-[#0B0F19]">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-blue-500">
                  <RefreshCw size={40} className="animate-spin" />
                  <p className="font-bold">Menarik rekaman portofolio siswa...</p>
                </div>
              ) : detailPortofolio.length === 0 ? (
                <div className="text-center py-20 text-slate-500">Belum ada riwayat pengerjaan yang tersimpan.</div>
              ) : (
                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-emerald-500">
                  
                  {/* Mapping Seluruh Fase Siswa */}
                  {detailPortofolio.map((data, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      
                      {/* Icon Bulatan Tengah */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-blue-500 text-white font-black text-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-md z-10">
                        {data.fase}
                      </div>

                      {/* Kotak Konten Fase */}
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                        
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="font-black text-slate-800 dark:text-white text-lg">Pengerjaan Fase {data.fase}</h3>
                          <span className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black px-2 py-1 rounded-md tracking-wider">
                            {data.tipe === 'kode' ? 'Python' : 'Verbal'}
                          </span>
                        </div>

                        {/* Input Siswa */}
                        <div className="mb-4">
                          {data.tipe === 'kode' ? (
                            <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-700/50">
                              <div className="bg-black/40 px-3 py-1.5 flex items-center gap-2 border-b border-white/5">
                                <Code size={12} className="text-emerald-400"/> <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Sintaks</span>
                              </div>
                              <pre className="p-4 text-emerald-300 font-mono text-sm overflow-x-auto whitespace-pre">
                                <code>{data.input_kode}</code>
                              </pre>
                            </div>
                          ) : (
                            <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                              {data.input_verbal}
                            </div>
                          )}
                        </div>

                        {/* Evaluasi AI */}
                        <div className="bg-indigo-50/80 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                          <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Sparkles size={14}/> Evaluasi AI
                          </h4>
                          <p className="text-indigo-900 dark:text-indigo-200/90 text-sm leading-relaxed">
                            {formatBintang(data.feedback_ai)}
                          </p>
                        </div>

                      </div>
                    </div>
                  ))}

                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md p-4 text-center border-t border-slate-200 dark:border-white/10 shrink-0">
               <p className="text-xs text-slate-500 font-bold">Rangkuman ini mencatat hasil pengerjaan terbaik siswa pada setiap fase.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}