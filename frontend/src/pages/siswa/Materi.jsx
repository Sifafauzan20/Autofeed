import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Materi() {
  const [materiTerpilih, setMateriTerpilih] = useState(null);
  const [sudahBacaSemua, setSudahBacaSemua] = useState(false);
  const [daftarMateri, setDaftarMateri] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://autofeed.my.id/api/materi')
      .then(response => {
        if (response.data.status === 'success') {
          const mappedData = response.data.data.map(item => {
            // Ekstraksi teks biasa dari JSON (Hanya untuk keperluan preview deskripsi singkat)
            let plainText = item.isi_konten;
            try {
                const parsed = JSON.parse(item.isi_konten);
                if (Array.isArray(parsed)) {
                    plainText = parsed.filter(b => b.type === 'text').map(b => b.content).join(' ');
                }
            } catch (e) { /* Abaikan jika data lama bukan format JSON */ }

            return {
              id: item.id,
              modul_id: item.modul_id, 
              judul: item.judul,
              deskripsi: plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText,
              isi_raw: item.isi_konten, // Menyimpan JSON mentahnya
              contohKodeLama: item.contoh_kode // Untuk kompatibilitas data lama
            };
          });
          setDaftarMateri(mappedData);
        }
      })
      .catch(error => console.error("Gagal mengambil materi:", error))
      .finally(() => setIsLoading(false));
  }, []);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setSudahBacaSemua(true);
    }
  };

  // --- FUNGSI MENGUBAH LINK YOUTUBE MENJADI VIDEO IFRAME + KREDIT LINK ---
  const formatTeksDanVideo = (teks) => {
    // Regex Baru: Menangkap DUA hal. 
    // Group 1: Seluruh URL utuh (termasuk ?si=)
    // Group 2: Hanya 11 digit Video ID
    const youtubeRegex = /((?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*)/g;
    
    // Pisahkan teks berdasarkan regex
    const parts = teks.split(youtubeRegex);
    const elements = [];

    // Jika tidak ada link YouTube, kembalikan teks biasa
    if (parts.length === 1) {
      return <p className="mb-6 leading-relaxed whitespace-pre-wrap">{teks}</p>;
    }

    let i = 0;
    // Karena kita punya 2 capturing group, array 'parts' akan terbagi tiga:
    // parts[i] = Teks biasa, parts[i+1] = Full URL, parts[i+2] = Video ID
    while (i < parts.length) {
      // 1. Masukkan teks biasa
      if (parts[i] && parts[i].trim() !== '') {
        elements.push(<p key={`text-${i}`} className="mb-6 leading-relaxed whitespace-pre-wrap">{parts[i]}</p>);
      }
      
      // 2. Masukkan Video YouTube dan Kredit Link
      if (parts[i + 2]) { // Pastikan Video ID berhasil ditangkap
        // Pastikan link memiliki https:// agar bisa diklik dengan benar
        const fullUrl = parts[i + 1].startsWith('http') ? parts[i + 1] : `https://${parts[i + 1]}`;
        const videoId = parts[i + 2];
        
        elements.push(
          <div key={`video-container-${i}`} className="my-8 w-full max-w-3xl mx-auto">
            {/* Player Video */}
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-black aspect-video relative">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            
            {/* Kredit Link (Bisa Diklik) */}
            <div className="mt-3 text-center md:text-right px-2">
              <a 
                href={fullUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                title="Buka video di tab baru"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Tonton di YouTube (Sumber)
              </a>
            </div>
          </div>
        );
      }
      i += 3; // Lompat 3 langkah karena ada 2 group Regex
    }

    return <>{elements}</>;
  };

  // --- FUNGSI RENDER BLOK DINAMIS ---
  const renderKontenDinamis = (isiRaw, kodeLama) => {
    try {
        const blocks = JSON.parse(isiRaw);
        if (Array.isArray(blocks)) {
            return blocks.map((block, idx) => {
                if (block.type === 'text') {
                    // Gunakan fungsi formatTeksDanVideo untuk merender teks dari JSON
                    return <div key={idx}>{formatTeksDanVideo(block.content)}</div>;
                } else if (block.type === 'code') {
                    return (
                        <div key={idx} className="my-8 rounded-2xl bg-slate-900/90 dark:bg-[#0d1117]/90 backdrop-blur-lg p-6 shadow-2xl border border-slate-700/50 dark:border-slate-800">
                          <div className="mb-4 flex gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          </div>
                          <pre className="overflow-x-auto font-mono text-[15px] text-indigo-300 dark:text-indigo-200">
                            <code>{block.content}</code>
                          </pre>
                        </div>
                    );
                }
                return null;
            });
        }
    } catch (e) {
        // JIKA BUKAN JSON (Data Lama) -> Tampilkan dengan cara lama yang sudah diupgrade dengan Video
        return (
            <>
              {formatTeksDanVideo(isiRaw)}
              {kodeLama && (
                <div className="my-10 rounded-2xl bg-slate-900/90 dark:bg-[#0d1117]/90 backdrop-blur-lg p-6 shadow-2xl border border-slate-700/50 dark:border-slate-800">
                  <div className="mb-4 flex gap-2"><div className="h-3 w-3 rounded-full bg-red-500"></div><div className="h-3 w-3 rounded-full bg-yellow-500"></div><div className="h-3 w-3 rounded-full bg-green-500"></div></div>
                  <pre className="overflow-x-auto font-mono text-[15px] text-indigo-300 dark:text-indigo-200"><code>{kodeLama}</code></pre>
                </div>
              )}
            </>
        );
    }
  };


  // ==========================================
  // TAMPILAN LOADING SEMENTARA
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-purple-600 dark:border-t-purple-400"></div>
          <p className="font-bold text-slate-600 dark:text-slate-300 animate-pulse">Menyiapkan Pustaka Materi...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN 1: DETAIL MATERI (SAAT DIBUKA)
  // ==========================================
  if (materiTerpilih) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-white/90 dark:bg-slate-950/40 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-md dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
        
        <div className="flex-shrink-0 z-10 flex items-center justify-between border-b border-white/50 dark:border-white/10 bg-white/30 dark:bg-black/20 p-5 shadow-sm backdrop-blur-md">
          <button 
            onClick={() => {
              setMateriTerpilih(null); 
              setSudahBacaSemua(false); 
            }}
            className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 transition-colors hover:text-purple-600 dark:hover:text-purple-400"
          >
            ← Kembali ke Pustaka
          </button>
          <div className="text-sm font-bold text-slate-500 dark:text-slate-400 opacity-80">PERTEMUAN {materiTerpilih.modul_id}: MEMPELAJARI MATERI</div>
        </div>

        <div className="relative scroll-smooth flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 xl:px-32 2xl:px-64 flex flex-col items-center" onScroll={handleScroll}>
          <div className="w-full max-w-5xl">
          <span className="rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm">
            PERTEMUAN {materiTerpilih.modul_id}
          </span>
          <h1 className="mb-8 mt-6 text-3xl font-black leading-tight text-slate-900 dark:text-white md:text-5xl drop-shadow-sm">
            {materiTerpilih.judul}
          </h1>
          
          <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 break-words">
            
            {/* RENDER KONTEN DINAMIS DILAKUKAN DI SINI */}
            {renderKontenDinamis(materiTerpilih.isi_raw, materiTerpilih.contohKodeLama)}

            <p className="rounded-r-xl border-l-4 border-purple-500 bg-purple-50/60 dark:bg-purple-900/20 backdrop-blur-sm py-3 pl-5 font-medium text-slate-700 dark:text-purple-100 shadow-sm mt-10">
              💡 <strong className="text-purple-700 dark:text-purple-300">Tips :</strong> Cobalah pahami alur logika dari materi atau video di atas sebelum melanjutkan ke studi kasus.
            </p>
          </div>
          
          <div className="flex h-40 w-full items-center justify-center opacity-50 mt-10">
             <div className="h-px w-24 bg-slate-400 dark:bg-slate-600"></div>
             <span className="mx-4 text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Akhir Materi</span>
             <div className="h-px w-24 bg-slate-400 dark:bg-slate-600"></div>
          </div>
          </div>
        </div>

        <div className="z-20 flex-shrink-0 border-t border-white/50 dark:border-white/10 bg-white/40 dark:bg-black/30 backdrop-blur-md p-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center">
            {!sudahBacaSemua && (
              <p className="mb-3 animate-bounce text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400">
                Scroll konten sampai ke bawah untuk membuka akses studi kasus ↓
              </p>
            )}
            <button 
              disabled={!sudahBacaSemua}
              onClick={() => {
                  // 1. Simpan bukti bahwa materi Modul INI sudah dibaca
                  const currentModulId = localStorage.getItem('activeModulId') || 1;
                  localStorage.setItem(`materi_selesai_modul_${currentModulId}`, 'true');
                  
                  // 2. Pindah ke halaman PBL
                  navigate('/siswa/pbl');
                }}
              className={`transform w-full rounded-2xl py-4 text-lg font-black transition-all duration-300 active:scale-95 md:w-[400px] ${
                sudahBacaSemua 
                ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/30 dark:shadow-purple-900/40 border border-purple-500/50 hover:-translate-y-1 hover:bg-purple-700' 
                : 'cursor-not-allowed border-2 border-white/50 dark:border-white/10 bg-white/30 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 backdrop-blur-sm'
              }`}
            >
              {sudahBacaSemua ? "Lanjut ke Workspace PBL →" : "Selesaikan Bacaan Terlebih Dahulu"}
            </button>
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // TAMPILAN 2: GRID DAFTAR MATERI (DEFAULT)
  // ==========================================
  return (
    <div className="flex h-full flex-col font-sans">
      
      <div className="relative z-10 flex-shrink-0 overflow-hidden rounded-3xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl px-8 py-8 mb-6 shadow-sm">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Pustaka Materi</h2>
          <p className="mt-2 text-lg font-medium text-slate-600 dark:text-slate-300">Pilih dan pahami materi sebelum memecahkan masalah.</p>
        </div>
      </div>

      <div className="pb-8">
        {daftarMateri.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300/50 dark:border-slate-700/50 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm py-16 text-center">
            <p className="font-bold text-slate-500 dark:text-slate-400">Belum ada materi yang tersedia untuk modul ini.</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {daftarMateri.map((materi, index) => (
              
              <div 
                key={materi.id} 
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1"
                onClick={() => {
                  setMateriTerpilih(materi);
                  localStorage.setItem('activeModulId', materi.modul_id);
                }}
              >
                <div className={`h-2 w-full transition-colors ${index === 0 ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-purple-400'}`}></div>
                
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider border backdrop-blur-sm bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-800/40 shadow-sm">
                      Pertemuan {materi.modul_id}
                    </span>
                  </div>
                  
                  <h3 className="mb-3 text-xl font-bold leading-tight text-slate-800 dark:text-slate-100 transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400">
                    {materi.judul}
                  </h3>
                  
                  <p className="mb-8 flex-1 leading-relaxed text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                    {materi.deskripsi}
                  </p>
                  
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/5 py-3.5 font-bold text-slate-700 dark:text-slate-300 transition-all duration-300 group-hover:bg-purple-600 group-hover:text-white dark:group-hover:bg-purple-500 group-hover:border-transparent shadow-sm">
                    Mulai Belajar
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </div>

            ))}
          </div>
        )}
      </div>

    </div>
  );
}