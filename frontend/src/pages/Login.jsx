import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; // 1. IMPORT IKON

export default function Login() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 2. STATE UNTUK MATA

  // Form State
  const [formData, setFormData] = useState({
    nama: '', kelas: '', email: '', password: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Memproses...");

    try {
      if (isLoginView) {
        // PROSES LOGIN
        const res = await axios.post('https://autofeed.my.id/api/login', {
          email: formData.email, password: formData.password
        });

        if (res.data.status === 'success') {
          toast.success("Berhasil masuk!", { id: toastId });
          localStorage.setItem('authUser', JSON.stringify(res.data.data));
          
          if (res.data.data.role === 'Guru') navigate('/guru');
          else navigate('/siswa');
        } else {
          toast.error(res.data.message, { id: toastId });
        }
      } else {
        // PROSES SIGNUP (DAFTAR)
        const res = await axios.post('https://autofeed.my.id/api/signup', formData);
        if (res.data.status === 'success') {
          toast.success(res.data.message, { id: toastId });
          setIsLoginView(true); 
          setFormData({ ...formData, password: '' }); 
        } else {
          toast.error(res.data.message, { id: toastId });
        }
      }
    } catch (error) {
      toast.error("Gagal terhubung ke server. Pastikan Backend menyala.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/60 dark:border-white/10 p-4 focus:ring-2 focus:ring-indigo-500 outline-none bg-white/50 dark:bg-black/30 backdrop-blur-sm text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-inner";

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-3xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-md relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30 mb-4">AF</div>
          <h2 className="text-3xl font-black tracking-tight">{isLoginView ? 'Selamat Datang' : 'Buat Akun Baru'}</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">
            {isLoginView ? 'Silakan masuk untuk melanjutkan belajar.' : 'Daftar sebagai siswa untuk memulai PBL.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginView && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Nama Lengkap</label>
                <input required type="text" name="nama" value={formData.nama} onChange={handleInputChange} className={inputClass} placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Kelas</label>
                <input required type="text" name="kelas" value={formData.kelas} onChange={handleInputChange} className={inputClass} placeholder="XII RPL 1" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Alamat Email</label>
            <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="email@sekolah.com" />
          </div>

          {/* 3. MODIFIKASI KOTAK KATA SANDI */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 block uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={formData.password} 
                onChange={handleInputChange} 
                className={`${inputClass} pr-12`} // Tambahan pr-12 agar teks tidak tertutup ikon
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl py-4 font-black text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 transition-all shadow-lg shadow-indigo-500/30 active:scale-95 disabled:bg-slate-400 disabled:shadow-none mt-4">
            {loading ? 'Memproses...' : (isLoginView ? 'Masuk ke Sistem' : 'Daftar Sekarang')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {isLoginView ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button onClick={() => setIsLoginView(!isLoginView)} className="ml-2 font-bold text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none">
              {isLoginView ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}