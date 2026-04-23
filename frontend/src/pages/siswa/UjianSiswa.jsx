import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PenTool, CheckCircle2, AlertTriangle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UjianSiswa() {
  const { tipeUjian } = useParams(); // Akan berisi 'pretest' atau 'posttest'
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('authUser'));

  const [daftarSoal, setDaftarSoal] = useState([]);
  const [jawabanSiswa, setJawabanSiswa] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sudahSelesai, setSudahSelesai] = useState(false);

  // Kunci unik untuk menyimpan auto-save di browser per siswa & per tipe ujian
  const storageKey = `autosave_${userData?.id}_${tipeUjian}`;

useEffect(() => {
    const cekAksesDanFetchSoal = async () => {
      setLoading(true);
      try {
        // 1. CEK SATPAM: Tanya ke database apakah saklar ujian sedang nyala?
        const resPengaturan = await axios.get('https://autofeed.my.id/api/pengaturan-ujian');
        if (resPengaturan.data.status === 'success') {
          const pengaturan = resPengaturan.data.data;
          
          // Jika siswa mengakses Pre-Test tapi saklarnya mati -> TENDANG!
          if (tipeUjian === 'pretest' && !pengaturan.pretest_aktif) {
            toast.error("Akses ditolak: Pre-Test sedang ditutup oleh Guru.", { duration: 4000 });
            navigate('/siswa/dashboard', { replace: true });
            return; // Hentikan eksekusi kode di bawahnya
          }
          
          // Jika siswa mengakses Post-Test tapi saklarnya mati -> TENDANG!
          if (tipeUjian === 'posttest' && !pengaturan.posttest_aktif) {
            toast.error("Akses ditolak: Post-Test sedang ditutup oleh Guru.", { duration: 4000 });
            navigate('/siswa/dashboard', { replace: true });
            return; // Hentikan eksekusi kode di bawahnya
          }
        }

        // 2. JIKA AMAN: Baru kita izinkan mengambil soal dari database
        const resSoal = await axios.get(`https://autofeed.my.id/api/soal-ujian/${tipeUjian}`);
        if (resSoal.data.status === 'success') {
          setDaftarSoal(resSoal.data.data);
          
          // Cek apakah ada jawaban tersimpan (Auto-save)
          const savedAnswers = localStorage.getItem(storageKey);
          if (savedAnswers) {
             setJawabanSiswa(JSON.parse(savedAnswers));
          }
        }
      } catch (err) {
        toast.error("Terjadi kesalahan sistem saat memuat ujian.");
        navigate('/siswa/dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    cekAksesDanFetchSoal();
  }, [tipeUjian, navigate, storageKey]); 

  const handlePilihJawaban = (soalId, opsiId) => {
    const newAnswers = { ...jawabanSiswa, [soalId]: opsiId };
    setJawabanSiswa(newAnswers);
    // Auto-save ke Local Storage setiap kali klik
    localStorage.setItem(storageKey, JSON.stringify(newAnswers));
  };

  const handleSubmit = async () => {
    // Validasi: Apakah semua soal sudah dijawab?
    if (Object.keys(jawabanSiswa).length < daftarSoal.length) {
      const yakin = window.confirm("Masih ada soal yang belum dijawab. Yakin ingin mengumpulkan?");
      if (!yakin) return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post('https://autofeed.my.id/api/ujian/submit', {
        user_id: userData.id,
        tipe_ujian: tipeUjian,
        jawaban_siswa: jawabanSiswa
      });

      if (res.data.status === 'success') {
        toast.success(`Berhasil!`);
        setSudahSelesai(true);
        // Hapus auto-save karena sudah beres
        localStorage.removeItem(storageKey); 
      } else {
        toast.error(res.data.message);
        if(res.data.message.includes("sudah pernah")) setSudahSelesai(true);
      }
    } catch (err) {
      toast.error("Gagal mengirim jawaban.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FUNGSI RENDER TEKS & KODE ---
  const formatTeksSoal = (teks) => {
    if (!teks) return "";
    // Deteksi blok kode (teks yang diapit oleh ```)
    const parts = teks.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Hapus backticks dan potong spasi berlebih
        const codeContent = part.replace(/```/g, '').trim();
        return (
          <div key={index} className="my-3 rounded-xl bg-slate-900/90 dark:bg-black/40 backdrop-blur-md p-4 shadow-inner border border-slate-700/50">
             <pre className="font-mono text-sm text-emerald-400 overflow-x-auto whitespace-pre-wrap">
               <code>{codeContent}</code>
             </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-line leading-relaxed">{part}</span>;
    });
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse">Menyiapkan lembar ujian...</div>;
  }

  if (sudahSelesai) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <CheckCircle2 size={64} className="text-emerald-500 mb-4" />
        <h2 className="text-2xl font-black">Ujian Selesai!</h2>
        <p className="text-slate-500 mt-2 mb-6">Jawaban Anda sudah terekam di sistem.</p>
        <button onClick={() => navigate('/siswa/dashboard')} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold">Kembali ke Dashboard</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
      <div className="bg-purple-600 text-white p-6 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg relative">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">{tipeUjian}</h1>
          <p className="text-purple-200 text-sm mt-1">Jawablah pertanyaan di bawah ini dengan teliti.</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl text-sm font-bold">
          <Save size={16} /> Auto-Saved
        </div>
      </div>

      {daftarSoal.length === 0 ? (
        <div className="text-center p-10 bg-white/50 rounded-3xl">Belum ada soal untuk ujian ini.</div>
      ) : (
        <div className="space-y-8">
          {daftarSoal.map((soal, index) => (
            <div key={soal.id} className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-3xl border border-white/50 shadow-sm">
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 shrink-0 bg-purple-100 text-purple-700 font-black rounded-lg flex items-center justify-center">{index + 1}</div>
                <div className="text-slate-800 dark:text-white font-medium text-lg">
                  {formatTeksSoal(soal.pertanyaan)}
                </div>
              </div>
              
              <div className="space-y-3 ml-12">
                {soal.opsi.map((opsi) => (
                  <label 
                    key={opsi.id} 
                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      jawabanSiswa[soal.id] === opsi.id 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-transparent bg-slate-100/50 hover:bg-slate-200/50 dark:bg-black/20 dark:hover:bg-black/40'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name={`soal_${soal.id}`} 
                      className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                      checked={jawabanSiswa[soal.id] === opsi.id}
                      onChange={() => handlePilihJawaban(soal.id, opsi.id)}
                    />
                    <div className="flex-1">
                      <span className="font-black mr-2">{opsi.id}.</span> 
                      {formatTeksSoal(opsi.teks)}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {daftarSoal.length > 0 && (
        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center gap-2"
          >
            {isSubmitting ? 'Mengirim...' : 'Kumpulkan Jawaban'}
          </button>
        </div>
      )}
    </div>
  );
}