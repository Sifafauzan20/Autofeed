import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Kuis() {
  const [jawabanSiswa, setJawabanSiswa] = useState({});
  const [sudahDikumpulkan, setSudahDikumpulkan] = useState(false);
  const [nilai, setNilai] = useState(0);
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const currentModulId = localStorage.getItem('activeModulId') || 1;
  const isPblSelesai = localStorage.getItem(`pbl_selesai_modul_${currentModulId}`) === 'true';

  // if (!isPblSelesai) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-full text-center">
  //       <h1>Kuis Terkunci 🔒</h1>
  //       <p>Selesaikan seluruh Fase di Workspace PBL untuk Pertemuan {currentModulId} terlebih dahulu.</p>
  //       <button onClick={() => navigate('/siswa/pbl')}>Kembali ke Workspace</button>
  //     </div>
  //   );
  // }

  // --- FITUR AUTO-SAVE ---
  useEffect(() => {
    const currentModulId = localStorage.getItem('activeModulId') || 1;
    const drafTersimpan = localStorage.getItem(`kuis_draft_modul_${currentModulId}`);
    
    if (drafTersimpan && !sudahDikumpulkan) {
      setJawabanSiswa(JSON.parse(drafTersimpan));
    }
  }, []);

  useEffect(() => {
    const currentModulId = localStorage.getItem('activeModulId') || 1;
    if (Object.keys(jawabanSiswa).length > 0 && !sudahDikumpulkan) {
      localStorage.setItem(`kuis_draft_modul_${currentModulId}`, JSON.stringify(jawabanSiswa));
    }
  }, [jawabanSiswa]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let currentModulId = localStorage.getItem('activeModulId');
    if (!currentModulId || currentModulId === 'undefined') currentModulId = 1; 
    
    axios.get(`http://localhost:8000/api/kuis/${currentModulId}`)
      .then(response => {
        if (response.data.status === 'success') {
          setDaftarSoal(response.data.data);
        }
      })
      .catch(error => console.error("Gagal mengambil soal kuis:", error))
      .finally(() => setIsLoading(false));
  }, []);

  const handlePilihJawaban = (soalId, opsiId) => {
    if (!sudahDikumpulkan) {
      setJawabanSiswa({ ...jawabanSiswa, [soalId]: opsiId });
    }
  };

  const handleSubmit = async () => {
    let jumlahBenar = 0;
    daftarSoal.forEach((soal) => {
      if (jawabanSiswa[soal.id] === soal.jawabanBenar) {
        jumlahBenar++;
      }
    });
    
    const skorAkhir = Math.round((jumlahBenar / daftarSoal.length) * 100);
    const userData = JSON.parse(localStorage.getItem('authUser'));
    
    if (!userData || !userData.id) {
      alert("Sesi login tidak valid. Silakan login ulang.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/kuis/submit', {
        user_id: userData.id,
        modul_id: 1, 
        skor: skorAkhir
      });

      if (response.data.status === 'success') {
        setNilai(skorAkhir);
        setSudahDikumpulkan(true);
        localStorage.removeItem(`kuis_draft_modul_${1}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Gagal menyimpan: " + response.data.message);
      }
    } catch (error) {
      console.error("Gagal menyimpan nilai kuis:", error);
      alert("Terjadi kesalahan server saat menyimpan nilai.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-purple-600 dark:border-t-purple-400"></div>
          <p className="font-bold text-slate-600 dark:text-slate-300 animate-pulse">Menyiapkan Evaluasi Kuis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col font-sans text-slate-800 dark:text-slate-100 bg-transparent overflow-y-auto pb-32">
      
      {/* HEADER STICKY */}
      {/* UBAH: Padding dan Margin disesuaikan untuk HP */}
      <div className="bg-white/40 dark:bg-slate-900/50 backdrop-blur-2xl px-5 md:px-8 py-4 md:py-6 border-b border-white/50 dark:border-white/10 shadow-sm z-20 sticky top-0 flex flex-col md:flex-row justify-between md:items-center gap-4 rounded-2xl md:rounded-3xl mb-4 md:mb-6 mt-2 mx-2 md:mx-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Evaluasi Akhir</h2>
          <p className="text-[13px] md:text-base text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">Uji pemahamanmu setelah memecahkan masalah di Workspace PBL.</p>
        </div>
        
        {/* Lencana Nilai */}
        {sudahDikumpulkan && (
          <div className={`flex flex-col md:items-end`}>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Hasil Akhir</span>
            <div className={`px-5 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl border flex items-center justify-center md:justify-start gap-2 shadow-sm backdrop-blur-md ${
              nilai >= 70 
              ? 'bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' 
              : 'bg-red-100/80 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
            }`}>
              Skor: {nilai} <span className="text-[12px] md:text-sm font-bold opacity-60">/ 100</span>
            </div>
          </div>
        )}
      </div>

      {/* KONTEN SOAL KUIS */}
      <div className="px-3 md:p-6 max-w-4xl mx-auto w-full">
        {daftarSoal.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-white/50 dark:border-white/10 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm py-12 md:py-16 text-center">
            <p className="font-bold text-slate-500 dark:text-slate-400 px-4">Belum ada soal kuis yang tersedia untuk modul ini.</p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {daftarSoal.map((soal, index) => (
              
              /* KARTU SOAL */
              <div key={soal.id} className="bg-white/90 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/10 p-5 md:p-8 shadow-md hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all">
                
                <h3 className="text-[15px] md:text-xl font-bold text-slate-900 dark:text-white mb-5 md:mb-6 leading-relaxed flex items-start gap-3 md:gap-4">
                  <span className="text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-900/50 px-3 py-0.5 md:px-3.5 md:py-1 rounded-lg md:rounded-xl shadow-inner border border-purple-200/50 dark:border-purple-800/50 flex-shrink-0 mt-0.5 md:mt-0">
                    {index + 1}
                  </span> 
                  {soal.pertanyaan}
                </h3>
                
                <div className="space-y-2.5 md:space-y-3">
                  {soal.opsi.map((opsi) => {
                    const isSelected = jawabanSiswa[soal.id] === opsi.id;
                    
                    let optionStyle = "border-slate-300 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500 bg-white/90 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm";
                    let badge = null;
                    
                    if (isSelected && !sudahDikumpulkan) {
                      optionStyle = "border-purple-500 bg-purple-100/80 dark:bg-purple-900/40 shadow-md text-purple-900 dark:text-purple-100 font-bold -translate-y-0.5";
                    }

                    if (sudahDikumpulkan) {
                      if (opsi.id === soal.jawabanBenar) {
                        optionStyle = "border-emerald-500 bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 font-bold border-2 shadow-sm";
                        badge = <span className="ml-auto bg-emerald-500 text-white text-[9px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-1 md:px-3 md:py-1 rounded-md md:rounded-lg shrink-0">Jawaban Benar</span>;
                      } else if (isSelected && opsi.id !== soal.jawabanBenar) {
                        optionStyle = "border-red-400 bg-red-100/90 dark:bg-red-900/60 text-red-900 dark:text-red-100 font-bold border-2 shadow-sm";
                        badge = <span className="ml-auto bg-red-500 text-white text-[9px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-1 md:px-3 md:py-1 rounded-md md:rounded-lg shrink-0">Jawabanmu Salah</span>;
                      } else {
                        optionStyle = "border-white/30 dark:border-white/5 bg-white/20 dark:bg-slate-800/20 text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed";
                      }
                    }

                    return (
                      <div 
                        key={opsi.id}
                        onClick={() => handlePilihJawaban(soal.id, opsi.id)}
                        // UBAH: Padding p-3.5 agar kotak jawaban nyaman di-tap di layar HP
                        className={`p-3.5 md:p-4 rounded-xl md:rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 md:gap-4 backdrop-blur-sm min-h-[60px] md:min-h-0 ${optionStyle} ${sudahDikumpulkan ? 'cursor-default pointer-events-none' : ''}`}
                      >
                        <div className={`h-5 w-5 md:h-6 md:w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors bg-white/50 dark:bg-slate-900/50 ${
                          isSelected && !sudahDikumpulkan ? 'border-purple-600' : 
                          sudahDikumpulkan && opsi.id === soal.jawabanBenar ? 'border-emerald-500' :
                          sudahDikumpulkan && isSelected ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && !sudahDikumpulkan && <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-purple-600"></div>}
                          {sudahDikumpulkan && opsi.id === soal.jawabanBenar && <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-emerald-500"></div>}
                          {sudahDikumpulkan && isSelected && opsi.id !== soal.jawabanBenar && <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-red-500"></div>}
                        </div>
                        
                        <span className="text-[13px] md:text-base flex-1 leading-relaxed">{opsi.teks}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AREA TOMBOL BAWAH */}
        {daftarSoal.length > 0 && (
          <div className="mt-8 md:mt-12 mb-8 pt-6 md:pt-8">
            {!sudahDikumpulkan ? (
              <div className="flex flex-col items-center px-2">
                <p className="text-slate-500 dark:text-slate-400 text-[12px] md:text-sm mb-4 font-bold tracking-wide text-center">Pastikan semua soal telah terjawab sebelum mengumpulkan.</p>
                <button 
                  onClick={handleSubmit}
                  disabled={Object.keys(jawabanSiswa).length < daftarSoal.length}
                  className={`w-full md:w-auto px-8 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-all duration-300 shadow-lg backdrop-blur-md ${
                    Object.keys(jawabanSiswa).length < daftarSoal.length 
                    ? 'bg-white/40 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-white/50 dark:border-white/10' 
                    : 'bg-purple-600 text-white hover:bg-purple-500 hover:-translate-y-1 hover:shadow-purple-500/30 border border-purple-400'
                  }`}
                >
                  Kumpulkan Evaluasi
                </button>
              </div>
            ) : (
              // TAMPILAN JIKA KUIS SELESAI
              <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 p-6 md:p-10 rounded-2xl md:rounded-3xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                <div className="text-5xl md:text-6xl mb-3 md:mb-4">🎉</div>
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Pembelajaran Selesai!</h4>
                <p className="text-[13px] md:text-lg text-slate-600 dark:text-slate-300 mb-6 md:mb-8 max-w-md leading-relaxed">
                  Luar biasa! Kamu telah menguasai teori algoritma dan memecahkan masalah PBL.
                </p>
                <button 
                  onClick={() => navigate('/siswa/dashboard')}
                  className="w-full md:w-auto px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-slate-900 dark:text-white text-[14px] md:text-lg transition-all duration-300 bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/20 hover:bg-white dark:hover:bg-white/20 shadow-lg md:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Kembali ke Dashboard Utama
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 