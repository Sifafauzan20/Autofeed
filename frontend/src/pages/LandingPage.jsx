import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, ArrowRight, Brain, Code, Award } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500 relative overflow-hidden flex flex-col">
      
      {/* Dekorasi Latar Belakang */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-400/30 dark:bg-teal-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HEADER NAVBAR */}
      <header className="relative z-10 py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black tracking-tight dark:text-white">AutoFeed</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2.5 rounded-full bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 backdrop-blur-md border border-white/50 dark:border-white/10 transition-all text-slate-600 dark:text-amber-400 shadow-sm">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl font-bold bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 backdrop-blur-md border border-white/60 dark:border-white/20 shadow-sm transition-all">
            Masuk / Daftar
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 mt-10 lg:mt-0">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 font-bold text-sm tracking-wide shadow-sm animate-fade-in">
          Platform Problem-Based Learning
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight max-w-4xl mb-6 text-slate-900 dark:text-white drop-shadow-sm">
          Perdalam Logika Pemrograman bersama <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400">AI Tutor AutoFeed.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-10 leading-relaxed">
          Tingkatkan kemampuan berpikir kritis Anda melalui studi kasus nyata. AutoFeed AI tidak memberikan jawaban langsung, melainkan memandu Anda layaknya mentor sejati.
        </p>
        <button onClick={() => navigate('/login')} className="px-10 py-5 rounded-2xl font-black text-lg text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 dark:border-indigo-500 hover:-translate-y-1 shadow-xl shadow-indigo-500/30 transition-all flex items-center gap-3">
          Mulai Belajar Gratis <ArrowRight size={24} />
        </button>

        {/* FITUR HIGHLIGHT (Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mt-20 w-full text-left">
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-5 border border-purple-200 dark:border-purple-800/50"><Brain size={24} /></div>
            <h3 className="text-xl font-bold mb-2">Automated Feedback</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Dapatkan evaluasi instan pada setiap baris kode dan analisis logika Anda dari asisten AI yang dilatih dengan metode Sokratik.</p>
          </div>
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-200 dark:border-emerald-800/50"><Code size={24} /></div>
            <h3 className="text-xl font-bold mb-2">Integrated Workspace</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Tulis, jalankan, dan perbaiki kode Python Anda langsung di dalam browser tanpa perlu menginstal aplikasi tambahan.</p>
          </div>
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-200 dark:border-amber-800/50"><Award size={24} /></div>
            <h3 className="text-xl font-bold mb-2">Evaluasi Kognitif</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Ukur peningkatan pemahaman algoritma Anda melalui pustaka materi interaktif dan evaluasi kuis terintegrasi.</p>
          </div>
        </div>
      </main>

    </div>
  );
}