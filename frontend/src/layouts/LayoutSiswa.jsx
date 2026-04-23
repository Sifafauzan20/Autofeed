import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, FileText, MonitorPlay, LogOut, Moon, Sun, Menu, X, PenTool } from 'lucide-react';
import axios from 'axios';

export default function LayoutSiswa() {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('authUser')) || { nama: 'Siswa', kelas: 'Kelas' };

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // STATE BARU UNTUK MENU HP

  const [statusUjian, setStatusUjian] = useState({ pretest_aktif: false, posttest_aktif: false });

  // --- TAMBAHKAN FUNGSI CEK STATUS INI ---
  useEffect(() => {
    // Fungsi untuk mengecek status ujian setiap kali halaman dimuat
    const cekStatusUjian = async () => {
      try {
        const res = await axios.get('http://autofeed.my.id/api/pengaturan-ujian');
        if (res.data.status === 'success' && res.data.data) {
          setStatusUjian(res.data.data);
        }
      } catch (err) {
        console.error("Gagal cek status ujian:", err);
      }
    };
    
    cekStatusUjian();
    // Opsional: Polling setiap 30 detik agar jika guru menyalakan saklar, siswa otomatis dapat update tanpa refresh
    const interval = setInterval(cekStatusUjian, 30000); 
    return () => clearInterval(interval);
  }, []);

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

  // Tutup menu otomatis jika siswa klik link di HP
  const handleLinkClick = () => setIsMobileOpen(false);

  const SidebarLink = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname.includes(to);
    return (
      <Link 
        to={to} 
        onClick={handleLinkClick}
        className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
          isActive 
          ? 'bg-white/60 dark:bg-white/10 text-indigo-700 dark:text-white shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/50 dark:border-white/20' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon size={20} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "opacity-70"} />
        {label}
      </Link>
    );
  };

  return (
    // UBAH: flex-col untuk HP, flex-row untuk Laptop
    <div className="flex flex-col md:flex-row h-screen w-full font-sans overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-500 bg-slate-50 dark:bg-slate-900">
      
      {/* HEADER MOBILE (Hanya muncul di HP) */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-black/20 backdrop-blur-md border-b border-white/20 z-30">
        <h2 className="text-2xl font-black tracking-tight dark:text-white">AutoFeed</h2>
        <div className="flex gap-4 items-center">
          <button onClick={toggleTheme} className="text-slate-600 dark:text-amber-400">
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          <button onClick={() => setIsMobileOpen(true)} className="text-slate-800 dark:text-white">
            <Menu size={26} />
          </button>
        </div>
      </div>

      {/* OVERLAY GELAP (Saat menu HP terbuka) */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR (Responsive: Fixed Drawer di HP, Static di Laptop) */}
      <aside className={`fixed md:static inset-y-0 left-0 w-[280px] bg-white/60 md:bg-white/40 dark:bg-slate-900/90 md:dark:bg-white/5 backdrop-blur-3xl border-r border-white/50 dark:border-white/10 flex flex-col flex-shrink-0 z-50 shadow-[8px_0_32px_0_rgba(31,38,135,0.05)] transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <div className="h-24 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight dark:text-white">AutoFeed</h2>
          </div>
          
          {/* Tombol Tema (Laptop) & Tombol Tutup Menu (HP) */}
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="hidden md:block p-2 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 backdrop-blur-md border border-white/50 dark:border-white/10 transition-all text-slate-600 dark:text-amber-400 shadow-sm">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 text-slate-500 hover:text-red-500">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="px-4 space-y-2 flex-1 overflow-y-auto mt-2">
          <SidebarLink to="/siswa/dashboard" icon={Home} label="Dashboard" />
          {statusUjian.pretest_aktif && (
             <SidebarLink to="/siswa/ujian/pretest" icon={PenTool} label="Ujian Pre-Test" />
          )}
          <SidebarLink to="/siswa/materi" icon={BookOpen} label="Pustaka Materi" />
          <SidebarLink to="/siswa/pbl" icon={MonitorPlay} label="Workspace PBL" />
          <SidebarLink to="/siswa/kuis" icon={FileText} label="Evaluasi Kuis" />
          {statusUjian.posttest_aktif && (
             <SidebarLink to="/siswa/ujian/posttest" icon={PenTool} label="Ujian Post-Test" />
          )}
        </div>

        <div className="p-5 mt-auto">
          <div className="bg-white/80 md:bg-white/50 dark:bg-slate-800 md:dark:bg-white/5 backdrop-blur-md rounded-3xl p-2 border border-white/50 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-3 bg-white/90 md:bg-white/60 dark:bg-slate-700 md:dark:bg-white/10 p-3 rounded-2xl mb-2 border border-transparent dark:border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner">
                {userData.nama.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate dark:text-white">{userData.nama}</p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate opacity-80">{userData.kelas}</p>
              </div>
            </div>

            <button onClick={handleLogout} className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-300 font-bold hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-white/10 w-full py-3 rounded-xl transition-all">
              <LogOut size={18} /> Keluar Sistem
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* UBAH: p-4 untuk HP agar tidak terlalu lebar, p-8 untuk Laptop */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-6 md:pt-10 z-10">
          <Outlet />
        </div>
      </main>

    </div>
  );
}