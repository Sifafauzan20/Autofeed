import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, MonitorPlay, CheckCircle2, Lock } from 'lucide-react';

const getInstruksiPBL = (fase) => {
  switch (fase) {
    case 1: return "Fase 1 (Orientasi): Pahami masalah. Variabel apa saja yang dibutuhkan? Kondisi apa yang menentukan hasil akhir?";
    case 2: return "Fase 2 (Organisasi): Langkah-langkah logika apa yang akan kamu gunakan? Tuliskan algoritmanya secara deskriptif.";
    case 3: return "Fase 3 (Penyelidikan): Terjemahkan logika Fase 2 ke sintaks Python. Tulis kodemu lalu jalankan (Run).";
    case 4: return "Fase 4 (Penyajian): Presentasikan hasil kodemu di depan kelas dan diskusikan jika ada logika yang kurang tepat.";
    case 5: return "Fase 5 (Evaluasi): Lakukan perbaikan kodemu (jika ada) berdasarkan hasil presentasi tadi. Jalankan kode, lalu minta evaluasi menyeluruh dari AI.";
    default: return "";
  }
};

// --- DAFTAR MODUL HARDCODE (Bisa disesuaikan dengan topik skripsi Anda) ---
const DAFTAR_STUDI_KASUS = [
  { id: 1, judul: "Pertemuan 1", topik: "Logika Dasar & Variabel", deskripsi: "Menganalisis dan merancang input/output sederhana." },
  { id: 2, judul: "Pertemuan 2", topik: "Struktur Percabangan (If-Else)", deskripsi: "Memecahkan masalah dengan logika pengambilan keputusan." },
  { id: 3, judul: "Pertemuan 3", topik: "Struktur Perulangan (Looping)", deskripsi: "Otomasi sistem dengan menggunakan while atau for loop." }
];

export default function WorkspacePBL() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('authUser')) || { id: 1, nama: 'Siswa', kelas: '' };
  
  // --- STATE UNTUK LAYAR PEMILIHAN MODUL ---
  const [isMemilihKasus, setIsMemilihKasus] = useState(true);
  const [currentModulId, setCurrentModulId] = useState(Number(localStorage.getItem('activeModulId')) || 1);

  // --- STATE WORKSPACE PBL ---
  const [fasePbl, setFasePbl] = useState(1);
  const [unlockedPhase, setUnlockedPhase] = useState(1); 
  
  const [modulData, setModulData] = useState(null);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  const [verbalInput, setVerbalInput] = useState('');
  const [code, setCode] = useState('');
  const [compilerOutput, setCompilerOutput] = useState('Sistem siap. Silakan ketik kode dan tekan Run.');
  
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isPhaseComplete, setIsPhaseComplete] = useState(false);
  const isFirstRender = useRef(true);

  // --- FUNGSI MEMILIH KASUS ---
  const handlePilihModul = (modulId) => {
    setCurrentModulId(modulId);
    localStorage.setItem('activeModulId', modulId);
    setIsMemilihKasus(false); // Sembunyikan layar pemilihan, buka workspace
  };

  // --- FITUR AUTO-SAVE (Dijalankan ulang setiap ganti modul) ---
  useEffect(() => {
    if (isMemilihKasus) return; 

    const progressTersimpan = localStorage.getItem(`pbl_draft_modul_${currentModulId}`);
    if (progressTersimpan) {
      try {
        const data = JSON.parse(progressTersimpan);
        setFasePbl(Number(data.fasePbl) || 1);
        setUnlockedPhase(Number(data.unlockedPhase) || 1); 
        setVerbalInput(data.verbalInput || '');
        setCode(data.code || '');
        setCompilerOutput(data.compilerOutput || 'Sistem siap. Silakan ketik kode dan tekan Run.');
        setFeedback(data.feedback || '');
        setAttemptCount(Number(data.attemptCount) || 0);
        setIsPhaseComplete(data.isPhaseComplete || false);
      } catch (e) {
        console.error("Gagal membaca storage", e);
      }
    } else {
      setFasePbl(1);
      setUnlockedPhase(1);
      setVerbalInput('');
      setCode('');
      setCompilerOutput('Sistem siap. Silakan ketik kode dan tekan Run.');
      setFeedback('');
      setAttemptCount(0);
      setIsPhaseComplete(false);
    }
  }, [currentModulId, isMemilihKasus]);

  useEffect(() => {
    if (isFirstRender.current || isMemilihKasus) {
      isFirstRender.current = false;
      return; 
    }
    const dataProgress = {
      fasePbl, unlockedPhase, verbalInput, code, compilerOutput, feedback, attemptCount, isPhaseComplete
    };
    localStorage.setItem(`pbl_draft_modul_${currentModulId}`, JSON.stringify(dataProgress));
  }, [fasePbl, unlockedPhase, verbalInput, code, compilerOutput, feedback, attemptCount, isPhaseComplete, currentModulId, isMemilihKasus]);
  
  // --- PENENTU TAMPILAN LAYAR ---
  const isVerbalPhase = fasePbl === 1 || fasePbl === 2; 
  const isCodingPhase = fasePbl === 3 || fasePbl === 5; 
  const isPresentationPhase = fasePbl === 4; 
  
  // --- AMBIL DATA SKENARIO DARI DATABASE ---
  useEffect(() => {
    if (isMemilihKasus) return;

    setIsLoadingDB(true);
    axios.get(`https://autofeed.my.id/api/soal/${currentModulId}`)
      .then(res => {
        if (res.data.status === 'success') setModulData(res.data.data);
        else setModulData(null); 
      })
      .catch(err => console.error("Gagal terhubung ke database:", err))
      .finally(() => setIsLoadingDB(false));
  }, [currentModulId, isMemilihKasus]);

  const instruksiDinamis = getInstruksiPBL(fasePbl);
  const kriteriaLulus = modulData?.rubrik_fase?.[fasePbl] || "Siswa harus menyelesaikan logika sesuai instruksi.";
  const skenarioDinamis = modulData?.skenario || "Memuat skenario dari database...";
  const judulModul = modulData?.judul || "Memuat Judul...";

  const handleRunCode = async () => {
    setIsRunning(true);
    if (compilerOutput.includes("Sistem siap")) setCompilerOutput(""); 

    try {
      const response = await axios.post('https://autofeed.my.id/api/run-code', { code: code, inputs: "" });
      if (response.data.status === "success") {
        setCompilerOutput(prev => prev + `\n[▶ RUN BERHASIL]\nOutput: ${response.data.output}\n`);
      } else {
        setCompilerOutput(prev => prev + `\n[▶ TERJADI ERROR]\nPesan: ${response.data.output}\n`);
      }
    } catch (error) {
      setCompilerOutput(prev => prev + "\n[▶ SYSTEM ERROR] Gagal terhubung ke server.\n");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitFeedback = async () => {
    setLoading(true);
    setFeedback('');
    const currentAttempt = attemptCount + 1;
    setAttemptCount(currentAttempt);

    try {
      const response = await axios.post('https://autofeed.my.id/api/feedback', {
        user_id: user.id, 
        modul_id: modulData ? modulData.id : 1, 
        fase_pbl: fasePbl,
        input_verbal: isVerbalPhase ? verbalInput : "", 
        input_kode: isCodingPhase ? code : "",
        output_compiler: isCodingPhase ? compilerOutput : "",
        jumlah_percobaan: currentAttempt,
        skenario_masalah: skenarioDinamis,
        rubrik_fase: kriteriaLulus
      });
      
      setFeedback(response.data.pesan_untuk_ui);
      
      if (response.data.status_lulus_fase === true || currentAttempt >= 4) {
        setIsPhaseComplete(true);
        if (currentAttempt >= 4 && response.data.status_lulus_fase === false) {
           setFeedback(prev => prev + "\n\n*(Batas percobaan telah habis. Silakan perhatikan evaluasi di atas dan lanjut ke fase berikutnya).*");
        }
      }
    } catch (error) {
      console.error(error);
      setFeedback("Error: Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPhase = () => {
    if (fasePbl < 5) handleJumpPhase(fasePbl + 1);
  };

  const handleJumpPhase = (faseTujuan) => {
    setFasePbl(faseTujuan);
    setUnlockedPhase(Math.max(unlockedPhase, faseTujuan)); 
    setFeedback('');
    setAttemptCount(0);
    setIsPhaseComplete(false);
    setCompilerOutput('Sistem siap. Silakan ketik kode dan tekan Run.');
  };

  const formatBintang = (teks) => {
    if (!teks) return "";
    const bagianTeks = teks.split(/(\*\*.*?\*\*)/g);
    return bagianTeks.map((potongan, index) => {
      if (potongan.startsWith('**') && potongan.endsWith('**')) {
        return <strong key={index} className="font-black text-indigo-700 dark:text-indigo-300">{potongan.slice(2, -2)}</strong>;
      }
      return potongan; 
    });
  };

  const renderTombolFase = (fase) => {
    const isLocked = fase > unlockedPhase;
    const isActive = fase === fasePbl;
    return (
      <button
        key={fase}
        onClick={() => !isLocked && handleJumpPhase(fase)}
        disabled={isLocked}
        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[11px] md:text-sm font-bold transition-all duration-200 border backdrop-blur-sm flex-1 md:flex-none text-center ${
          isActive 
          ? 'bg-indigo-600/90 dark:bg-indigo-500/90 text-white border-indigo-500 shadow-md shadow-indigo-500/30' 
          : isLocked 
          ? 'bg-slate-200/80 dark:bg-white/5 text-slate-500 dark:text-slate-600 border-slate-300/80 dark:border-white/5 cursor-not-allowed' 
          : 'bg-white/80 dark:bg-white/10 border-slate-300/50 dark:border-white/20 text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-white/20 shadow-sm' 
        }`}
      >
        {isLocked ? `🔒 ${fase}` : (isPhaseComplete && isActive ? `✅ ${fase}` : `Fase ${fase}`)}
      </button>
    );
  };

  // ==========================================
  // RENDER 1: LAYAR PEMILIHAN MODUL
  // ==========================================
  if (isMemilihKasus) {
    return (
      <div className="flex flex-col h-full bg-transparent p-4 md:p-8 animate-fade-in pb-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
            Pilih Studi Kasus
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Pilih skenario pembelajaran Problem-Based Learning yang ingin kamu kerjakan hari ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DAFTAR_STUDI_KASUS.map((mod) => {
            const isDone = localStorage.getItem(`pbl_selesai_modul_${mod.id}`) === 'true';

            return (
              <div 
                key={mod.id} 
                onClick={() => handlePilihModul(mod.id)}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] transition-all duration-300 cursor-pointer group hover:-translate-y-2 flex flex-col h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none transition-all group-hover:bg-indigo-500/20"></div>

                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
                    <MonitorPlay size={28} />
                  </div>
                  {isDone && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 size={16} /> Selesai
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
                    {mod.judul}
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-3 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {mod.topik}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {mod.deskripsi}
                  </p>
                </div>

                <button className="w-full py-3.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  Mulai Pengerjaan &rarr;
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: LAYAR LOADING
  // ==========================================
  if (isLoadingDB) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4 bg-white/40 dark:bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-white/10 border-t-indigo-600 dark:border-t-indigo-400"></div>
          <p className="font-bold text-slate-600 dark:text-white animate-pulse">Menyiapkan Ruang Belajar...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: ERROR JIKA DATABASE TIDAK ADA
  // ==========================================
  if (!isLoadingDB && !modulData) {
     return (
       <div className="flex flex-col h-full items-center justify-center bg-transparent gap-4 p-8 text-center">
         <div className="bg-white/40 dark:bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/50 dark:border-white/10 shadow-lg mx-4">
           <h1 className="text-xl font-bold text-red-500 dark:text-red-400 mb-2">Skenario Belum Dibuat</h1>
           <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm md:text-base">Guru belum membuat skenario PBL untuk pertemuan ini di database.</p>
           <div className="flex gap-4 justify-center">
             <button onClick={() => setIsMemilihKasus(true)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300">Kembali</button>
             <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md">Muat Ulang</button>
           </div>
         </div>
       </div>
     );
  }

  // ==========================================
  // RENDER 4: WORKSPACE UTAMA (PBL)
  // ==========================================
  return (
    <div className="flex h-full flex-col font-sans text-slate-800 dark:text-slate-100 bg-transparent transition-colors relative">
      
      {/* HEADER PBL */}
      <div className="bg-white/40 dark:bg-white/10 backdrop-blur-2xl px-4 md:px-6 py-4 border-b border-white/50 dark:border-white/10 shadow-sm z-10 rounded-t-3xl">
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsMemilihKasus(true)}
               className="p-2 bg-white/50 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-white/10 rounded-xl transition-colors shadow-sm border border-slate-200 dark:border-white/10"
               title="Kembali ke Daftar Kasus"
             >
               <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
             </button>
             <div>
               <p className="text-[10px] md:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Pertemuan {currentModulId}</p>
               <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">{judulModul}</h2>
             </div>
           </div>
           
           <div className="flex flex-wrap gap-1.5 md:gap-2 w-full xl:w-auto">
              {renderTombolFase(1)} {renderTombolFase(2)} {renderTombolFase(3)} {renderTombolFase(4)} {renderTombolFase(5)}
           </div>
         </div>
      </div>

      <div className="flex w-full flex-1 flex-col md:flex-row rounded-b-3xl overflow-y-auto md:overflow-hidden">
        
        {isPresentationPhase ? (
          /* ==========================================
             TAMPILAN KHUSUS FASE 4: FULL SCREEN PRESENTASI
             ========================================== */
          <div className="flex-1 w-full bg-slate-900 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto z-20 rounded-b-3xl">
            <div className="w-full max-w-4xl text-center animate-fade-in">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">🎤 Mode Presentasi Hasil Karya</h3>
              <p className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
                Silakan presentasikan hasil kodemu di depan kelas. Jelaskan alur logikanya dan diskusikan masukan dari teman-teman atau guru.
              </p>
              
              <div className="text-left bg-[#0d1117] p-6 rounded-2xl border border-slate-700 mb-8 overflow-x-auto shadow-2xl relative">
                {/* Decoration dot */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <pre className="mt-6 text-emerald-400 font-mono text-[14px] md:text-base leading-relaxed">
                  <code>{code || "# Belum ada kode yang diselesaikan di Fase 3."}</code>
                </pre>
              </div>

              <button 
                onClick={async () => {
                  try {
                    await axios.post('https://autofeed.my.id/api/feedback', {
                      user_id: user.id, modul_id: modulData ? modulData.id : 1, fase_pbl: 4,
                      input_verbal: "", input_kode: code, output_compiler: "",
                      jumlah_percobaan: 1, skenario_masalah: "", rubrik_fase: ""
                    });
                  } catch (e) { console.error("Gagal simpan fase 4", e); }
                  handleJumpPhase(5);
                }}
                className="w-full md:w-auto px-8 py-4 text-[15px] md:text-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-1"
              >
                ✅ Akhiri Presentasi & Lanjut Evaluasi Akhir (Fase 5)
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================
             TAMPILAN NORMAL FASE 1, 2, 3, 5: 2 KOLOM
             ========================================== */
          <>
            {/* KOLOM KIRI (Instruksi & Input) */}
            <div className="flex w-full md:flex-[1.2] flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/20 backdrop-blur-xl p-4 md:p-6 overflow-y-visible md:overflow-y-auto shrink-0">
              
              <div className="mb-4 md:mb-5 rounded-r-2xl border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-500/10 backdrop-blur-sm p-4 shadow-sm">
                <p className="text-[13px] md:text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
                  <span className="font-bold text-amber-700 dark:text-amber-400">💡 Instruksi Tugas Fase {fasePbl}:</span> <br/>{instruksiDinamis}
                </p>
              </div>

              <article className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 leading-relaxed text-[14px] md:text-[15px] mb-5 md:mb-6 bg-white dark:bg-white/5 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-slate-300 dark:border-white/10 shadow-sm">
                <p>{skenarioDinamis}</p>
              </article>

              {/* AREA INPUT VERBAL (Hanya Fase 1 & 2) */}
              {isVerbalPhase && (
                <div className="flex-1 mt-2 flex flex-col">
                  <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Area Analisis & Jawaban:</label>
                  <textarea
                    value={verbalInput}
                    onChange={(e) => setVerbalInput(e.target.value)}
                    disabled={isPhaseComplete}
                    placeholder="Ketik analisis, alasan, atau logikamu secara detail di sini..."
                    className={`flex-1 min-h-[120px] md:min-h-[150px] w-full resize-none rounded-2xl border p-4 md:p-5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-md ${
                      isPhaseComplete 
                      ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400' 
                      : 'bg-white dark:bg-black/40 border-slate-300 dark:border-white/10 dark:text-white'
                    }`}
                  />
                </div>
              )}

              {/* EDITOR PYTHON (Hanya Fase 3 & 5) */}
              {isCodingPhase && (
                <div className="mt-2 md:mt-4 flex flex-col shadow-md rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10 shrink-0">
                  <div className="flex items-center justify-between bg-slate-800 dark:bg-black/60 backdrop-blur-md text-white px-4 py-2.5 md:px-5 md:py-3 border-b border-slate-700 dark:border-white/10">
                    <label className="text-[13px] md:text-sm font-bold flex items-center gap-2">
                      <span className="text-emerald-400">🐍</span> Editor Python
                    </label>
                    <button 
                      onClick={handleRunCode}
                      disabled={isRunning || isPhaseComplete}
                      className={`rounded-lg px-3 py-1.5 md:px-4 text-[11px] md:text-xs font-bold transition shadow-sm ${isRunning || isPhaseComplete ? 'bg-slate-700 dark:bg-white/10 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-400'}`}
                    >
                      {isRunning ? "Mengeksekusi..." : "▶ Jalankan"}
                    </button>
                  </div>
                  
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isPhaseComplete}
                    className={`w-full min-h-[250px] md:min-h-[300px] resize-none p-4 md:p-5 font-mono text-[13px] md:text-[14px] leading-relaxed focus:outline-none transition-all overflow-y-auto ${
                      isPhaseComplete 
                      ? 'bg-slate-100 dark:bg-black/40 text-slate-500' 
                      : 'bg-[#1e1e1e] dark:bg-black/60 text-indigo-100 dark:text-indigo-300'
                    }`}
                    placeholder="# Ketik sintaks Python kamu di sini..."
                    spellCheck="false"
                  />
                </div>
              )}

              {/* TOMBOL FEEDBACK AI */}
              <button 
                onClick={handleSubmitFeedback}
                disabled={loading || isPhaseComplete || (isVerbalPhase && !verbalInput.trim()) || (isCodingPhase && !code.trim())}
                className={`mt-6 w-full rounded-2xl py-3.5 md:py-4 text-[14px] md:text-[16px] font-black transition-all shadow-lg backdrop-blur-sm ${
                  loading || isPhaseComplete || (isVerbalPhase && !verbalInput.trim()) || (isCodingPhase && !code.trim()) 
                  ? 'bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white border border-indigo-400 dark:border-indigo-500/50 hover:-translate-y-1 shadow-indigo-500/30'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menganalisis...
                  </span>
                ) : (
                  isPhaseComplete ? `Fase Selesai (${attemptCount}/4 Percobaan)` : `🤖 Minta Feedback AI (${attemptCount}/4)`
                )}
              </button>
            </div>

            {/* KOLOM KANAN (Console & AI Feedback) */}
            <div className="flex w-full md:flex-[0.8] flex-col md:h-full relative bg-white/20 dark:bg-black/40 backdrop-blur-lg shrink-0">
              
              {/* CONSOLE (Hanya Fase 3 & 5) */}
              {isCodingPhase && (
                <div className="flex h-[250px] md:h-auto md:flex-[0.4] flex-col bg-[#010409]/90 dark:bg-black/60 backdrop-blur-xl overflow-hidden border-b border-slate-800 dark:border-white/10 shrink-0">
                  <div className="flex items-center px-4 py-2 border-b border-slate-800/50 dark:border-white/10 bg-black/40">
                    <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Console Output</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 font-mono text-[12px] md:text-[13px] text-emerald-400 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed">
                    {compilerOutput}
                  </div>
                </div>
              )}

              <div className={`flex flex-col overflow-hidden ${isCodingPhase ? 'h-[350px] md:h-auto md:flex-[0.6]' : 'min-h-[400px] md:min-h-0 md:flex-1'}`}>
                <div className="flex items-center gap-3 bg-white/40 dark:bg-white/5 p-3 md:p-4 shadow-sm z-10 border-b border-white/50 dark:border-white/10 backdrop-blur-md">
                  <div>
                    <h2 className="font-bold text-[15px] md:text-base text-slate-900 dark:text-white leading-tight">Automation Feedback</h2>
                    <p className="text-[10px] md:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 tracking-wide uppercase mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>Asisten AI Aktif
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-start">
                   {loading ? (
                     <div className="flex flex-col items-center justify-center h-full text-indigo-500 dark:text-indigo-400 animate-pulse font-bold text-sm">
                       <div className="h-8 w-8 rounded-full border-4 border-indigo-200 dark:border-white/10 border-t-indigo-600 dark:border-t-indigo-400 animate-spin mb-3"></div>
                       Menyusun umpan balik...
                     </div>
                   ) : feedback ? (
                     <>
                       <div className="bg-indigo-50/90 dark:bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-3xl rounded-tl-none border border-indigo-100 dark:border-white/10 shadow-md inline-block self-start max-w-[95%] text-slate-800 dark:text-slate-200 text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap">
                         {formatBintang(feedback)}
                       </div>
                       
                       {isPhaseComplete && (
                         <button 
                           onClick={() => {
                              if (fasePbl < 5) {
                                handleNextPhase();
                              } else {
                                localStorage.setItem(`pbl_selesai_modul_${currentModulId}`, 'true');
                                setIsMemilihKasus(true);
                              }
                           }}
                           className={`mt-6 w-full rounded-2xl py-3 md:py-4 text-sm md:text-base font-black text-white shadow-lg transition-all flex justify-center items-center gap-2 ${
                             fasePbl === 5 
                             ? 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-500 shadow-purple-500/30'
                             : 'bg-emerald-500 dark:bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30'
                           }`}
                         >
                           {fasePbl < 5 ? `Selesai! Lanjut Fase ${fasePbl + 1}` : `Kembali ke Menu Utama →`} 
                         </button>
                       )}
                     </>
                   ) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-center text-sm px-4">
                       <div className="text-3xl md:text-4xl mb-3 opacity-40">💭</div>
                       <p className="font-bold text-slate-700 dark:text-slate-300">Belum ada evaluasi.</p>
                       <p className="mt-1 text-[12px] md:text-[13px] opacity-80">Kerjakan tugas di atas lalu klik Minta Feedback AI.</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}