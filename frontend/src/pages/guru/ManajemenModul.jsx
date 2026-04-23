import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, HelpCircle, Save, MonitorPlay, Plus, Code, AlignLeft, Trash2 } from 'lucide-react';

export default function ManajemenModul() {
  const [activeTab, setActiveTab] = useState('materi');
  const [loading, setLoading] = useState(false);

  // --- STATE KHUSUS MATERI (BLOCK EDITOR) ---
  const [formMateri, setFormMateri] = useState({ modul_id: 1, urutan: 1, judul: '' });
  // Default ada 1 blok teks
  const [materiBlocks, setMateriBlocks] = useState([{ id: Date.now(), type: 'text', content: '' }]);

  // --- STATE LAINNYA ---
  const [formKuis, setFormKuis] = useState({ modul_id: 1, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', jawaban_benar: 'A' });
  const [formSkenario, setFormSkenario] = useState({
    modul_id: 1, judul: '', skenario: '',
    rubrik: [
      { fase: 1, kriteria: '' },
      { fase: 2, kriteria: '' },
      { fase: 3, kriteria: '' },
      { fase: 4, kriteria: '' },
      { fase: 5, kriteria: '' }
    ]
  });

  // Tambahkan array placeholder ini tepat di bawah state formSkenario
  const placeholderFase = [
    "Contoh (Orientasi): Siswa mampu mengidentifikasi variabel 'harga' dan 'diskon', serta menyebutkan kondisi batas diskon dari studi kasus.",
    "Contoh (Organisasi): Siswa dapat menuliskan langkah-langkah logika (algoritma deskriptif) secara berurutan sebelum mulai mengoding.",
    "Contoh (Penyelidikan): Siswa mampu menerjemahkan logika dari Fase 2 ke dalam sintaks Python (misalnya menggunakan if-else) dengan benar.",
    "Contoh (Penyajian): Siswa berhasil menjalankan kode (Run) dan memastikan output di terminal sudah sesuai untuk semua kondisi soal.",
    "Contoh (Evaluasi): Siswa mampu menjelaskan perubahan logika yang ia alami dan merefleksikan kesulitannya saat menyelesaikan kasus."
  ];

  // --- FUNGSI BLOCK EDITOR ---
  const addBlock = (type) => {
    setMateriBlocks([...materiBlocks, { id: Date.now(), type, content: '' }]);
  };

  const updateBlock = (id, newContent) => {
    setMateriBlocks(materiBlocks.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  const removeBlock = (id) => {
    setMateriBlocks(materiBlocks.filter(b => b.id !== id));
  };

  // --- FUNGSI SUBMIT ---
  const handleSimpan = async (endpoint, payload, resetFormFunc, pesanSukses) => {
    setLoading(true);
    try {
      const res = await axios.post(`https://autofeed.my.id/api/guru/${endpoint}`, payload);
      
      if (res.data.status === 'success') {
        // Jika berhasil, munculkan popup sukses
        alert("✅ SUKSES: " + (res.data.message || pesanSukses));
        if (resetFormFunc) resetFormFunc();
      } else {
        // JIKA GAGAL, BROWSER AKAN MEMAKSA MUNCUL POPUP ERROR DARI DATABASE!
        alert("❌ GAGAL DARI DATABASE:\n\n" + res.data.message);
      }
      
    } catch (err) {
      alert("Gagal terhubung ke server backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMateri = (e) => {
    e.preventDefault();
    // Mengubah array blok menjadi string JSON untuk disimpan di isi_konten
    const payload = {
      ...formMateri,
      tipe: 'Video', // Hardcode agar API database tidak error
      durasi: '-',    // Hardcode agar API database tidak error
      contoh_kode: '', 
      isi_konten: JSON.stringify(materiBlocks) // Keajaiban terjadi di sini!
    };
    handleSimpan('materi', payload, () => {
      setFormMateri({ ...formMateri, judul: '', urutan: formMateri.urutan + 1 });
      setMateriBlocks([{ id: Date.now(), type: 'text', content: '' }]);
    });
  };

  const handleSubmitKuis = (e) => {
    e.preventDefault();
    handleSimpan('kuis', formKuis, () => setFormKuis({ ...formKuis, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', jawaban_benar: 'A' }));
  };

  const handleSubmitSkenario = (e) => {
    e.preventDefault();
    handleSimpan('skenario', formSkenario, () => {
      // Perintah untuk mengosongkan form Skenario setelah sukses disimpan
      setFormSkenario({
        ...formSkenario, // Mempertahankan angka modul_id yang sedang aktif
        judul: '', 
        skenario: '',
        rubrik: [
          { fase: 1, kriteria: '' },
          { fase: 2, kriteria: '' },
          { fase: 3, kriteria: '' },
          { fase: 4, kriteria: '' },
          { fase: 5, kriteria: '' }
        ]
      });
    }, "Skenario PBL berhasil disimpan!");
  };

  // --- GAYA DESAIN UMUM ---
  const inputClass = "w-full rounded-xl border border-slate-300 dark:border-white/10 p-3.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white/90 dark:bg-black/30 backdrop-blur-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:shadow-md focus:shadow-md";
  const labelClass = "text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block";
  const activeTabClass = "bg-white/80 dark:bg-white/10 text-blue-700 dark:text-blue-400 shadow-sm border border-white/60 dark:border-white/10";
  const inactiveTabClass = "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
        
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-white/10 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manajemen Konten Modul</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Bangun alur pembelajaran lengkap: Materi → Kasus PBL → Kuis Evaluasi.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 bg-slate-100/80 dark:bg-black/20 p-2 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md mb-6 shadow-inner">
          <button
              onClick={() => setActiveTab('materi')} // Sesuaikan dengan nama state Anda
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'materi'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <FileText size={18} /> 1. Pustaka Materi
            </button>

            {/* TOMBOL 2: SKENARIO PBL */}
            <button
              onClick={() => setActiveTab('pbl')} // Sesuaikan dengan nama state Anda
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'pbl'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <MonitorPlay size={18} /> 2. Skenario PBL
            </button>

            {/* TOMBOL 3: EVALUASI KUIS */}
            <button
              onClick={() => setActiveTab('kuis')} // Sesuaikan dengan nama state Anda
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'kuis'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              <HelpCircle size={18} /> 3. Evaluasi Kuis
            </button>
        </div>

        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          
          {/* ================= FORM 1: MATERI (BLOCK EDITOR) ================= */}
          {activeTab === 'materi' && (
            <form onSubmit={handleSubmitMateri} className="space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 mb-6 flex gap-4 items-center">
                <label className="text-sm font-black text-blue-700 dark:text-blue-300 whitespace-nowrap">Untuk Pertemuan Ke-</label>
                <input required type="number" min="1" value={formMateri.modul_id} onChange={e => setFormMateri({...formMateri, modul_id: parseInt(e.target.value)})} className={`${inputClass} w-24 text-center font-bold`} />
              </div>
              
              <div>
                <label className={labelClass}>Judul Materi</label>
                <input required type="text" value={formMateri.judul} onChange={e => setFormMateri({...formMateri, judul: e.target.value})} className={inputClass} placeholder="Misal: Perulangan For Loop" />
              </div>

              {/* EDITOR DINAMIS */}
              <div className="mt-8 space-y-4">
                <label className={labelClass}>Isi Konten (Block Editor)</label>
                
                {materiBlocks.map((block, index) => (
                  <div key={block.id} className="relative group animate-fade-in flex items-start gap-3">
                    {/* Indikator Angka */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-2">
                      {index + 1}
                    </div>

                    <div className="flex-1 relative">
                      {block.type === 'text' ? (
                        <textarea 
                          required rows="4" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} 
                          className={`${inputClass} resize-none`} placeholder="Ketik paragraf materi di sini..."
                        />
                      ) : (
                        <div className="rounded-xl border border-slate-700 dark:border-white/10 bg-[#0d1117]/90 dark:bg-black/60 overflow-hidden">
                          <div className="bg-black/40 px-4 py-1.5 flex items-center gap-2">
                            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase flex items-center gap-1"><Code size={12}/> Blok Kode Python</span>
                          </div>
                          <textarea 
                            required rows="5" value={block.content} onChange={e => updateBlock(block.id, e.target.value)} spellCheck="false"
                            className="w-full bg-transparent p-4 text-emerald-400 font-mono text-sm resize-none outline-none focus:ring-0" placeholder="# Ketik kode Python di sini..."
                          />
                        </div>
                      )}
                      
                      {/* Tombol Hapus (Muncul saat di-hover, kecuali block pertama) */}
                      {materiBlocks.length > 1 && (
                        <button type="button" onClick={() => removeBlock(block.id)} className="absolute -right-3 -top-3 bg-red-100 dark:bg-red-900/50 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-200 dark:border-red-800">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Tombol Tambah Blok */}
                <div className="flex gap-3 pl-11 pt-2">
                  <button type="button" onClick={() => addBlock('text')} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-white/10">
                    <Plus size={16} /> <AlignLeft size={16} /> Tambah Paragraf
                  </button>
                  <button type="button" onClick={() => addBlock('code')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-colors border border-emerald-200 dark:border-emerald-800/50">
                    <Plus size={16} /> <Code size={16} /> Sisipkan Kode
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-slate-400 mt-8">
                <Save size={20} /> Simpan Materi ke Database
              </button>
            </form>
          )}

          {/* ================= FORM 2: SKENARIO PBL (Tetap) ================= */}
          {activeTab === 'pbl' && (
            <form onSubmit={handleSubmitSkenario} className="space-y-6">
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mb-6 flex gap-4 items-center">
                <label className="text-sm font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">Untuk Pertemuan Ke-</label>
                <input required type="number" min="1" value={formSkenario.modul_id} onChange={e => setFormSkenario({...formSkenario, modul_id: parseInt(e.target.value)})} className={`${inputClass} w-24 text-center font-bold`} />
              </div>
              <div>
                <label className={labelClass}>Judul Skenario Masalah</label>
                <input required type="text" value={formSkenario.judul} onChange={e => setFormSkenario({...formSkenario, judul: e.target.value})} className={inputClass} placeholder="Misal: Kasus Optimasi Pencarian E-Commerce" />
              </div>
              <div>
                <label className={labelClass}>Deskripsi Kasus / Skenario (Yang akan dibaca siswa)</label>
                <textarea required rows="4" value={formSkenario.skenario} onChange={e => setFormSkenario({...formSkenario, skenario: e.target.value})} className={`${inputClass} resize-none`} placeholder="Ceritakan studi kasus secara detail..."></textarea>
              </div>
              <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">Instruksi & Kriteria Kelulusan AI</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Tuliskan target spesifik yang harus dicapai siswa pada setiap fase. AI akan membaca rubrik ini sebagai <b>"Kunci Jawaban"</b> untuk mengevaluasi apakah siswa boleh lanjut ke fase berikutnya atau masih perlu dibimbing.
                </p>
                
                {formSkenario.rubrik.map((r, index) => (
                  <div key={r.fase} className="flex gap-4 items-start">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black rounded-lg px-3 py-2 text-sm flex-shrink-0 border border-indigo-200 dark:border-indigo-700 shadow-sm">Fase {r.fase}</div>
                    <textarea 
                      required 
                      rows="2" 
                      value={r.kriteria}
                      placeholder={placeholderFase[index]}  // <--- Placeholder dinamis ditambahkan di sini
                      onChange={(e) => {
                        const newRubrik = [...formSkenario.rubrik];
                        newRubrik[index].kriteria = e.target.value;
                        setFormSkenario({...formSkenario, rubrik: newRubrik});
                      }}
                      className={`${inputClass} text-sm`}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-slate-400 mt-6 border border-indigo-500">
                <Save size={20} /> Simpan Skenario & Rubrik PBL
              </button>
            </form>
          )}

          {/* ================= FORM 3: KUIS (Tetap) ================= */}
          {activeTab === 'kuis' && (
            <form onSubmit={handleSubmitKuis} className="space-y-6">
              <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 mb-6 flex gap-4 items-center">
                <label className="text-sm font-black text-emerald-700 dark:text-emerald-300 whitespace-nowrap">Untuk Pertemuan Ke-</label>
                <input required type="number" min="1" value={formKuis.modul_id} onChange={e => setFormKuis({...formKuis, modul_id: parseInt(e.target.value)})} className={`${inputClass} w-24 text-center font-bold`} />
              </div>
              <div>
                <label className={labelClass}>Pertanyaan Soal</label>
                <textarea required rows="3" value={formKuis.pertanyaan} onChange={e => setFormKuis({...formKuis, pertanyaan: e.target.value})} className={`${inputClass} resize-none`} placeholder="Ketik pertanyaan kuis di sini..."></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white/30 dark:bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/50 dark:border-white/5">
                <div><label className={labelClass}>Opsi A</label><input required type="text" value={formKuis.opsi_a} onChange={e => setFormKuis({...formKuis, opsi_a: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Opsi B</label><input required type="text" value={formKuis.opsi_b} onChange={e => setFormKuis({...formKuis, opsi_b: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Opsi C</label><input required type="text" value={formKuis.opsi_c} onChange={e => setFormKuis({...formKuis, opsi_c: e.target.value})} className={inputClass} /></div>
                <div><label className={labelClass}>Opsi D</label><input required type="text" value={formKuis.opsi_d} onChange={e => setFormKuis({...formKuis, opsi_d: e.target.value})} className={inputClass} /></div>
              </div>
              <div>
                <label className={labelClass}>Jawaban Benar</label>
                <select value={formKuis.jawaban_benar} onChange={e => setFormKuis({...formKuis, jawaban_benar: e.target.value})} className="w-full rounded-xl border border-emerald-300 dark:border-emerald-700/50 p-3.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-sm text-emerald-900 dark:text-emerald-300 font-bold transition-all">
                  <option value="A" className="text-slate-800">Opsi A</option><option value="B" className="text-slate-800">Opsi B</option>
                  <option value="C" className="text-slate-800">Opsi C</option><option value="D" className="text-slate-800">Opsi D</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-slate-400 mt-6">
                <Save size={20} /> Simpan Soal Kuis
              </button>
            </form>
          )}

        </div>
    </div>
  );
}