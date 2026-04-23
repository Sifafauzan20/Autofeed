import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, FolderEdit, LogOut, Moon, Sun, Menu, X, ClipboardList, ChevronDown, CheckCircle2, ListTodo, Settings } from 'lucide-react';

export default function LayoutGuru() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('authUser')) || { nama: 'Bapak/Ibu Guru' };

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- STATE UNTUK MODAL RUBRIK ---
  const [isRubrikModalOpen, setIsRubrikModalOpen] = useState(false);
  const [selectedModul, setSelectedModul] = useState(1);
  const [rubrikData, setRubrikData] = useState(null);
  const [isLoadingRubrik, setIsLoadingRubrik] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('appTheme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('appTheme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    navigate('/'); 
  };

  const handleLinkClick = () => setIsMobileOpen(false);

  // --- FUNGSI MENGAMBIL DATA RUBRIK DARI BACKEND ---
  const fetchRubrik = async (modulId) => {
    setIsLoadingRubrik(true);
    try {
      const res = await axios.get(`https://autofeed.my.id/api/soal/${modulId}`);
      if (res.data.status === 'success' && res.data.data) {
        setRubrikData(res.data.data);
      } else {
        setRubrikData(null); // Kosongkan jika belum ada skenario
      }
    } catch (error) {
      console.error("Gagal mengambil rubrik:", error);
      setRubrikData(null);
    } finally {
      setIsLoadingRubrik(false);
    }
  };

  // Efek samping: Jika modal terbuka atau pilihan modul berubah, ambil data baru
  useEffect(() => {
    if (isRubrikModalOpen) {
      fetchRubrik(selectedModul);
    }
  }, [isRubrikModalOpen, selectedModul]);


  const SidebarLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname.includes(to);
    return (
      <Link 
        to={to} 
        onClick={handleLinkClick}
        className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
          isActive 
          ? 'bg-white/60 dark:bg-white/10 text-blue-700 dark:text-blue-400 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 dark:border-white/20' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon size={20} className={isActive ? "text-blue-600 dark:text-blue-400" : "opacity-70"} />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full font-sans overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-500 bg-slate-50 dark:bg-slate-900">
      
      {/* HEADER MOBILE (Guru) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-white/20 z-30">
        <div>
           <h2 className="text-xl font-black tracking-tight dark:text-white leading-none">AutoFeed</h2>
           <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mt-1">Teacher Panel</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleTheme} className="text-slate-600 dark:text-amber-400">
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <button onClick={() => setIsMobileOpen(true)} className="text-slate-800 dark:text-white">
            <Menu size={26} />
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR GURU */}
      <aside className={`fixed md:static inset-y-0 left-0 w-[280px] bg-white/60 md:bg-white/40 dark:bg-slate-900/90 md:dark:bg-white/5 backdrop-blur-3xl border-r border-white/50 dark:border-white/10 flex flex-col flex-shrink-0 z-50 shadow-[8px_0_32px_0_rgba(31,38,135,0.05)] transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <div className="h-24 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight dark:text-white leading-none">AutoFeed</h2>
              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mt-1">Teacher Panel</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="hidden md:block p-2 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 backdrop-blur-md border border-white/50 dark:border-white/10 transition-all text-slate-600 dark:text-amber-400 shadow-sm">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-red-500">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="px-4 space-y-2 flex-1 overflow-y-auto mt-4">
          <SidebarLink to="/guru/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/guru/manajemen" icon={FolderEdit} label="Manajemen Modul" />
          <SidebarLink to="/guru/hasil-pbl" icon={ListTodo} label="Hasil PBL Siswa" />
          <SidebarLink to="/guru/pengaturan-ujian" icon={Settings} label="Pretest-Posttest" />
          
          {/* TOMBOL BARU: LIHAT RUBRIK KELULUSAN */}
          <button 
            onClick={() => { setIsRubrikModalOpen(true); setIsMobileOpen(false); }}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
          >
            <ClipboardList size={20} className="opacity-70" />
            Cek Rubrik AI
          </button>
        </div>

        <div className="p-5 mt-auto">
          <div className="bg-white/80 md:bg-white/50 dark:bg-slate-800 md:dark:bg-white/5 backdrop-blur-md rounded-3xl p-2 border border-white/50 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-3 bg-white/90 md:bg-white/60 dark:bg-slate-700 md:dark:bg-white/10 p-3 rounded-2xl mb-2 border border-transparent dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner">
                {userData.nama.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate dark:text-white">{userData.nama}</p>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate opacity-80">Fasilitator PBL</p>
              </div>
            </div>

            <button onClick={handleLogout} className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-white/10 w-full py-3 rounded-xl transition-all">
              <LogOut size={18} /> Keluar Sistem
            </button>
          </div>
        </div>
      </aside>

      {/* MODAL POP-UP RUBRIK KELULUSAN */}
      {isRubrikModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/50 dark:border-white/10">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <ClipboardList className="text-indigo-500" /> Referensi Rubrik Socratic
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Kriteria yang digunakan AI untuk mengevaluasi jawaban siswa.</p>
              </div>
              <button onClick={() => setIsRubrikModalOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-transparent">
              
              {/* Dropdown Pemilihan Modul */}
              <div className="mb-8 flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-black/30 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Lihat Rubrik Untuk:</label>
                <div className="relative flex-1">
                  <select 
                    value={selectedModul} 
                    onChange={(e) => setSelectedModul(parseInt(e.target.value))}
                    className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white py-3 pl-4 pr-10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>Pertemuan {num}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Konten Rubrik */}
              {isLoadingRubrik ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
                  <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="font-bold animate-pulse">Menarik data dari database...</p>
                </div>
              ) : rubrikData ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-1">Kasus PBL Terpilih</h4>
                    <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{rubrikData.judul}</p>
                    <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-2 leading-relaxed">{rubrikData.skenario}</p>
                  </div>

                  <div className="space-y-3">
                    {rubrikData.rubrik_fase && Object.entries(rubrikData.rubrik_fase).map(([fase, kriteria]) => (
                      <div key={fase} className="flex gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black text-lg border border-emerald-200 dark:border-emerald-800/50">
                          {fase}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Kriteria Fase {fase}</h4>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span>{kriteria}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <ClipboardList size={32} className="text-slate-400" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">Belum Ada Skenario</h4>
                  <p className="text-slate-500 mt-2 max-w-sm">Anda belum membuat skenario dan rubrik PBL untuk Pertemuan {selectedModul}. Silakan buat di menu Manajemen Modul.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 md:pt-10 z-10">
          <Outlet />
        </div>
      </main>

    </div>
  );
}