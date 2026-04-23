import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Award, History, Code, Sparkles, Filter, ChevronDown, RefreshCw } from 'lucide-react';

export default function DashboardSiswa() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('authUser')) || { id: 1, nama: 'Siswa' };

  // --- STATE UNTUK PORTOFOLIO ---
  const [selectedModul, setSelectedModul] = useState(1);
  const [detailPortofolio, setDetailPortofolio] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- FUNGSI MENGAMBIL DATA PORTOFOLIO SISWA INI ---
  const fetchPortofolioSaya = async () => {
    setLoadingDetail(true);
    try {
      // Menggunakan endpoint yang sama dengan guru, tetapi otomatis mengunci user_id milik siswa yang login
      const res = await axios.get(`http://autofeed.my.id/api/guru/portofolio/${userData.id}/${selectedModul}`);
      if (res.data.status === 'success') {
        setDetailPortofolio(res.data.data);
      } else {
        setDetailPortofolio([]);
      }
    } catch (err) {
      console.error(err);
      setDetailPortofolio([]); 
    } finally {
      setLoadingDetail(false);
    }
  };

  // Muat ulang data setiap kali nomor pertemuan diubah
  useEffect(() => {
    fetchPortofolioSaya();
  }, [selectedModul]);

  const formatBintang = (teks) => {
    if (!teks) return "-";
    const parts = teks.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => part.startsWith('**') ? <strong key={i} className="text-purple-600 dark:text-purple-400">{part.slice(2, -2)}</strong> : part);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* ==================================================== */}
      {/* 1. HERO BANNER (KOMPONEN ASLI - TIDAK DIHAPUS) */}
      {/* ==================================================== */}
      <div className="bg-white/50 dark:bg-white/10 backdrop-blur-xl rounded-3xl p-10 flex items-center justify-between border border-white/60 dark:border-white/10 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="z-10 max-w-lg">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4 text-slate-800 dark:text-white transition-colors">
            Selamat datang kembali, <br/>
            <span className="text-purple-600 dark:text-purple-400">{userData.nama}!</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium mb-8 text-lg transition-colors">
            Mulailah dengan memahami konsep dasar algoritma sebelum memecahkan masalah bersama AutoFeed.
          </p>
          <button 
            onClick={() => navigate('/siswa/materi')}
            className="bg-purple-600 dark:bg-purple-500 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-purple-700 dark:hover:bg-purple-400 hover:-translate-y-1 transition-all shadow-lg shadow-purple-500/30 dark:shadow-purple-900/40 border border-purple-500/50 dark:border-purple-400/50"
          >
            Mulai Pelajari Materi →
          </button>
        </div>
        <div className="hidden lg:block absolute right-10 -bottom-10 opacity-80">
          <div className="text-[150px] drop-shadow-2xl">🚀</div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. KARTU STATISTIK (KOMPONEN ASLI - TIDAK DIHAPUS) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-white/50 dark:border-white/10 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-all">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Materi Selesai</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white transition-colors">1<span className="text-lg text-slate-500 dark:text-slate-400 font-medium">/3</span></p>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-white/50 dark:border-white/10 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-all">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-500/30">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Poin Keaktifan</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white transition-colors">120<span className="text-lg text-slate-500 dark:text-slate-400 font-medium"> Poin</span></p>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-lg p-6 rounded-3xl shadow-sm border border-white/50 dark:border-white/10 flex items-center justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-all">
          <div>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 transition-colors">Progres PBL</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white transition-colors">Fase 3</p>
          </div>
          <div className="relative w-20 h-20 flex items-center justify-center drop-shadow-md">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/50 dark:text-white/10" />
               <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset="90" className="text-purple-500 dark:text-purple-400" />
             </svg>
             <span className="absolute text-sm font-black text-purple-700 dark:text-purple-300">60%</span>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. KOMPONEN BARU: PORTOFOLIO / RANGKUMAN PRIBADI */}
      {/* ==================================================== */}
      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-white/10 overflow-hidden shadow-sm mt-8">
        
        {/* HEADER PORTOFOLIO & DROPDOWN FILTER */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="w-full md:w-auto">
            <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <History size={24} className="shrink-0" /> Rangkuman Perjalanan PBL Saya
            </h2>
            <p className="text-purple-100 text-xs md:text-sm font-medium mt-1">Review kembali jalan pikiran dan kode yang telah kamu buat.</p>
          </div>
          
          {/* Dropdown Filter Modul - DIPERBAIKI WARNA DAN RESPONSIVITASNYA */}
          <div className="relative w-full md:w-56 shrink-0 z-20">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-700 bg-white p-1.5 rounded-lg pointer-events-none shadow-sm">
              <Filter size={14} strokeWidth={3} />
            </div>
            <select 
              value={selectedModul}
              onChange={(e) => setSelectedModul(Number(e.target.value))}
              className="w-full appearance-none pl-14 pr-10 py-3.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 outline-none focus:ring-2 focus:ring-white transition-all font-bold text-white cursor-pointer hover:bg-white/30"
            >
              <option value={1} className="text-slate-800">Pertemuan 1</option>
              <option value={2} className="text-slate-800">Pertemuan 2</option>
              <option value={3} className="text-slate-800">Pertemuan 3</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={20} strokeWidth={3} />
          </div>
        </div>

        {/* AREA KONTEN TIMELINE FASE */}
        <div className="p-4 md:p-10 bg-slate-50/50 dark:bg-slate-900/50 min-h-[300px]">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-purple-500 py-10">
              <RefreshCw size={40} className="animate-spin" />
              <p className="font-bold">Mengambil data portofoliomu...</p>
            </div>
          ) : detailPortofolio.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                 <History size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">Belum Ada Catatan</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Kamu belum mengerjakan PBL pada Pertemuan {selectedModul}.</p>
            </div>
          ) : (
            // GARIS TIMELINE - DIPERBAIKI POSISI DAN WARNANYA
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[2.25rem] md:before:ml-[2.75rem] before:-translate-x-px before:h-full before:w-1 before:bg-slate-200 dark:before:bg-slate-700 before:rounded-full">
              
              {/* Mapping Seluruh Fase Siswa */}
              {detailPortofolio.map((data, index) => (
                <div key={index} className="relative flex flex-col md:flex-row items-start gap-4 md:gap-6 group z-10 pl-2 md:pl-0">
                  
                  {/* Icon Bulatan Kiri - DIPERBAIKI BAYANGAN DAN KONTRASTNYA */}
                  <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-[6px] border-slate-50 dark:border-slate-900 bg-purple-600 text-white font-black text-lg shrink-0 shadow-lg z-10">
                    {data.fase}
                  </div>

                  {/* Kotak Konten Fase */}
                  <div className="w-[calc(100%-3rem)] md:w-full md:flex-1 p-5 md:p-7 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow ml-10 md:ml-0 mt-[-3rem] md:mt-0">
                   
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                      <h3 className="font-black text-slate-800 dark:text-white text-lg">Catatan Fase {data.fase}</h3>
                      <span className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black px-3 py-1.5 rounded-lg tracking-wider border border-slate-200 dark:border-white/10">
                        {data.tipe === 'kode' ? '📝 Sintaks Python' : '💭 Teks Verbal'}
                      </span>
                    </div>

                    {/* Input Siswa */}
                    <div className="mb-5">
                      {data.tipe === 'kode' ? (
                        <div className="bg-[#0d1117] rounded-xl overflow-hidden border border-slate-700/50 shadow-inner">
                          <div className="bg-black/40 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                            <Code size={14} className="text-emerald-400"/> <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Sintaks Saya</span>
                          </div>
                          <pre className="p-5 text-emerald-300 font-mono text-sm overflow-x-auto whitespace-pre leading-relaxed">
                            <code>{data.input_kode}</code>
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-slate-50 dark:bg-black/20 p-5 rounded-xl border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed font-medium">
                          {data.input_verbal}
                        </div>
                      )}
                    </div>

                    {/* Evaluasi AI */}
                    <div className="bg-purple-50/80 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800/50">
                      <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Sparkles size={16}/> Umpan Balik AI
                      </h4>
                      <p className="text-purple-900 dark:text-purple-200/90 text-[14px] leading-relaxed">
                        {formatBintang(data.feedback_ai)}
                      </p>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

    </div>
  );
}