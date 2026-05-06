import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Users, Target, AlertTriangle, BookOpen, Clock, CheckCircle2, XCircle, LayoutDashboard, ListTodo, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DashboardGuru() {
  const [activeTab, setActiveTab] = useState('pbl'); 
  const [stats, setStats] = useState({ total_siswa: 0, rata_skor: 0, perlu_bantuan: 0 });
  const [dataPBL, setDataPBL] = useState([]);
  const [dataKuis, setDataKuis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  

  // --- 1. LOGIKA BARU: PENGELOMPOKAN SKOR KUIS ---
  // Kita gunakan metode Object Mapping yang jauh lebih aman dari error Array
  const grafikKriteriaSkor = useMemo(() => {
    let kategori = {
      "0-50": 0,
      "51-69": 0,
      "70-85": 0,
      "86-100": 0
    };

    // Hitung jumlah siswa untuk tiap kategori
    dataKuis.forEach(k => {
      const skor = parseInt(k.skor) || 0;
      if (skor <= 50) kategori["0-50"] += 1;
      else if (skor <= 69) kategori["51-69"] += 1;
      else if (skor <= 85) kategori["70-85"] += 1;
      else kategori["86-100"] += 1;
    });

    // Ubah formatnya menjadi Array agar bisa dibaca oleh Recharts
    return Object.keys(kategori).map(key => ({
      kriteria: key,
      siswa: kategori[key]
    }));
  }, [dataKuis]);

  // --- 2. Data Grafik Tingkat Kesulitan PBL ---
  const grafikKesulitanPBL = useMemo(() => {
    const diff = [
      { fase: 'Fase 1', total: 0, count: 0 }, { fase: 'Fase 2', total: 0, count: 0 },
      { fase: 'Fase 3', total: 0, count: 0 }, { fase: 'Fase 4', total: 0, count: 0 },
      { fase: 'Fase 5', total: 0, count: 0 },
    ];
    dataPBL.forEach(p => {
      const idx = p.fase - 1;
      if (diff[idx]) {
        diff[idx].total += parseInt(p.percobaan_ke) || 1;
        diff[idx].count++;
      }
    });
    return diff.map(d => ({
      fase: d.fase,
      "Rata-Rata Percobaan": d.count === 0 ? 0 : parseFloat((d.total / d.count).toFixed(1))
    }));
  }, [dataPBL]);

  // --- 3. Data Grafik Rasio Kelulusan Kuis ---
  const grafikKelulusanKuis = useMemo(() => {
    let lulus = 0, remedial = 0;
    dataKuis.forEach(k => { 
      const skor = Number(k.skor) || 0;
      if (skor >= 70) lulus++; else remedial++; 
    });
    return [
      { name: 'Tercapai (≥ 70)', value: lulus },
      { name: 'Remedial (< 70)', value: remedial }
    ];
  }, [dataKuis]);

  const WARNA_PIE = ['#10b981', '#ef4444']; 

  const handleExportCSV = (type) => {
    let csvContent = "\uFEFF"; 
    const separator = ";"; 
    if (type === 'pbl') {
      csvContent += `Waktu${separator}Nama Siswa${separator}Kelas${separator}Pertemuan${separator}Fase${separator}Percobaan Ke${separator}Input Siswa${separator}Status\n`;
      dataPBL.forEach((row) => {
        try {
          const waktu = row.waktu ? new Date(row.waktu).toLocaleString('id-ID').replace(/,/g, '') : '-';
          const nama = `"${(row.nama_siswa || row.nama || '-').replace(/"/g, '""')}"`;
          const kelas = `"${(row.kelas || '-').replace(/"/g, '""')}"`;
          const modul = row.modul_id || 1;
          const fase = row.fase || '-';
          const percobaan = row.percobaan_ke || '-';
          let teksInput = "";
          if (row.input_verbal) teksInput += row.input_verbal + " ";
          if (row.input_kode) teksInput += row.input_kode;
          const inputBersih = String(teksInput).replace(/"/g, '""').replace(/\n/g, ' ');
          const input = `"${inputBersih}"`;
          let status = 'REVISI';
          if (row.status_lulus === 1 || row.status_lulus === true || row.status_lulus === "1") status = 'LULUS';
          csvContent += `${waktu}${separator}${nama}${separator}${kelas}${separator}${modul}${separator}${fase}${separator}${percobaan}${separator}${input}${separator}${status}\n`;
        } catch (error) { console.error(error); }
      });
    } else {
      csvContent += `Waktu Selesai${separator}Nama Siswa${separator}Kelas${separator}Pertemuan${separator}Skor Akhir${separator}Predikat\n`;
      dataKuis.forEach((row) => {
        try {
          const waktu = row.waktu_selesai ? new Date(row.waktu_selesai).toLocaleString('id-ID').replace(/,/g, '') : '-';
          const nama = `"${(row.nama_siswa || row.nama || '-').replace(/"/g, '""')}"`;
          const kelas = `"${(row.kelas || '-').replace(/"/g, '""')}"`;
          const modul = row.modul_id || 1;
          const skor = row.skor || 0;
          const predikat = skor >= 70 ? 'TERCAPAI' : 'REMEDIAL';
          csvContent += `${waktu}${separator}${nama}${separator}${kelas}${separator}${modul}${separator}${skor}${separator}${predikat}\n`;
        } catch (error) { console.error(error); }
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_${type.toUpperCase()}_AutoFeed.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, pblRes, kuisRes] = await Promise.all([
        axios.get('https://autofeed.my.id/api/guru/stats'),
        axios.get('https://autofeed.my.id/api/guru/riwayat'),
        axios.get('https://autofeed.my.id/api/guru/hasil-kuis')
      ]);
      if (statsRes.data.status === 'success') setStats(statsRes.data.data);
      if (pblRes.data.status === 'success') setDataPBL(pblRes.data.data);
      if (kuisRes.data.status === 'success') setDataKuis(kuisRes.data.data);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAllData(); }, []);

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, bgIconClass }) => (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-start justify-between transition-all hover:bg-white/60 dark:hover:bg-white/10">
      <div>
        <p className="text-[11px] md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 md:mb-2">{title}</p>
        <h3 className={`text-3xl md:text-4xl font-black ${colorClass}`}>{value}</h3>
        {subtitle && <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-500 mt-1 md:mt-2 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${bgIconClass} ${colorClass} shrink-0`}>
        <Icon size={24} className="md:w-7 md:h-7" />
      </div>
    </div>
  );

  const customTooltipStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    color: '#334155',
    fontWeight: 'bold'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-0 space-y-6 md:space-y-8 animate-fade-in pb-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md p-5 md:p-6 rounded-3xl border border-white/50 dark:border-white/10 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 md:p-2.5 bg-blue-600 dark:bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/30 shrink-0"><LayoutDashboard size={20} className="md:w-6 md:h-6" /></div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium md:ml-1 leading-relaxed">Monitoring progres kognitif dan evaluasi belajar siswa</p>
          </div>
          <button 
            onClick={fetchAllData} disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/20 px-4 md:px-6 py-3 rounded-2xl font-bold text-sm md:text-base text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white hover:dark:bg-white/20 transition-all disabled:opacity-50 backdrop-blur-sm"
          >
            <Clock size={16} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Memperbarui..." : "Perbarui Data"}
          </button>
        </div>

        {/* KARTU STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <StatCard title="Total Siswa" value={stats.total_siswa} icon={Users} colorClass="text-blue-600 dark:text-blue-400" bgIconClass="bg-blue-100 dark:bg-blue-500/20" />
          <StatCard title="Rata-rata Kuis" value={stats.rata_skor} subtitle="Dari Modul Aktif" icon={Target} colorClass="text-emerald-600 dark:text-emerald-400" bgIconClass="bg-emerald-100 dark:bg-emerald-500/20" />
          <StatCard title="Perlu Intervensi" value={stats.perlu_bantuan} subtitle="*Gagal ≥ 4x di Fase PBL" icon={AlertTriangle} colorClass="text-red-500 dark:text-red-400" bgIconClass="bg-red-100 dark:bg-red-500/20" />
        </div>

        {/* AREA GRAFIK (CHARTS) */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAFIK 1 BARU: PENGELOMPOKAN KRITERIA SKOR */}
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/60 dark:border-white/10 shadow-sm lg:col-span-1 flex flex-col h-[350px]">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-500" /> Kriteria Skor Siswa
              </h3>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grafikKriteriaSkor} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                    <XAxis dataKey="kriteria" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartsTooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                    <Bar dataKey="siswa" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafik 2: Tingkat Kesulitan PBL */}
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/60 dark:border-white/10 shadow-sm lg:col-span-1 flex flex-col h-[350px]">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-purple-500" /> Tingkat Kesulitan PBL
              </h3>
              <p className="text-[10px] text-slate-500 mb-2 -mt-2 italic">*Berdasarkan rata-rata percobaan per fase</p>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={grafikKesulitanPBL} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.2} />
                    <XAxis dataKey="fase" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={customTooltipStyle} />
                    <Line type="monotone" dataKey="Rata-Rata Percobaan" stroke="#a855f7" strokeWidth={4} dot={{ r: 5, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grafik 3: Rasio Kelulusan */}
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-5 border border-white/60 dark:border-white/10 shadow-sm lg:col-span-1 flex flex-col h-[350px]">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-emerald-500" /> Ketuntasan Belajar
              </h3>
              <div className="flex-1 w-full flex items-center justify-center min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={grafikKelulusanKuis} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {grafikKelulusanKuis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={WARNA_PIE[index % WARNA_PIE.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={customTooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* AREA TAB & KONTEN TABEL */}
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/60 dark:border-white/10 overflow-hidden flex flex-col">
          
          <div className="flex flex-col lg:flex-row justify-between items-center border-b border-white/50 dark:border-white/10 bg-white/30 dark:bg-black/20 p-3 md:p-4 gap-3">
            <div className="flex w-full lg:w-auto gap-2 md:gap-3">
              <button 
                onClick={() => setActiveTab('pbl')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-[11px] md:text-sm transition-all ${activeTab === 'pbl' ? 'bg-white/80 dark:bg-white/10 text-blue-700 dark:text-blue-400 shadow-sm border border-white/60 dark:border-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'}`}
              >
                <ListTodo size={16} /> Riwayat PBL
              </button>
              <button 
                onClick={() => setActiveTab('kuis')}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold text-[11px] md:text-sm transition-all ${activeTab === 'kuis' ? 'bg-white/80 dark:bg-white/10 text-blue-700 dark:text-blue-400 shadow-sm border border-white/60 dark:border-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'}`}
              >
                <BookOpen size={16} /> Hasil Kuis
              </button>
            </div>
            <button 
              onClick={() => handleExportCSV(activeTab)}
              disabled={isLoading || (activeTab === 'pbl' ? dataPBL.length === 0 : dataKuis.length === 0)}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-xl md:rounded-2xl font-bold text-[12px] md:text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              Unduh CSV Laporan
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            {isLoading ? (
              <div className="p-10 md:p-20 text-center text-slate-500 dark:text-slate-400 font-bold animate-pulse flex flex-col items-center gap-3">
                <div className="h-6 w-6 md:h-8 md:w-8 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
                Menyiapkan Laporan...
              </div>
            ) : activeTab === 'pbl' ? (
              
              <table className="w-full text-left text-[12px] md:text-sm whitespace-nowrap">
                <thead className="bg-white/30 dark:bg-black/20 text-slate-600 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider border-b border-white/50 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3 md:p-5 font-semibold">Waktu Pengerjaan</th>
                    <th className="px-4 py-3 md:p-5 font-semibold">Identitas Siswa</th>
                    <th className="px-4 py-3 md:p-5 font-semibold text-center">Fase</th>
                    <th className="px-4 py-3 md:p-5 font-semibold text-center">Percobaan</th>
                    <th className="px-4 py-3 md:p-5 font-semibold">Input Logika/Kode</th>
                    <th className="px-4 py-3 md:p-5 font-semibold">Status AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50 dark:divide-white/5">
                  {dataPBL.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 md:p-10 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada riwayat aktivitas PBL.</td></tr>
                  ) : (
                    dataPBL.map((log, i) => (
                      <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 md:p-5 text-slate-600 dark:text-slate-400">{new Date(log.waktu).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="px-4 py-3 md:p-5">
                          <div className="font-bold text-slate-900 dark:text-white">{log.nama_siswa}</div>
                          <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">{log.kelas || 'Tanpa Kelas'}</div>
                        </td>
                        <td className="px-4 py-3 md:p-5 text-center">
                          <span className="bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black border border-blue-200/50 dark:border-blue-800/50">Fase {log.fase}</span>
                        </td>
                        <td className="px-4 py-3 md:p-5 text-center">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Ke-{log.percobaan_ke}</span>
                          {/* Tambahkan indikator peringatan ini */}
                          {log.percobaan_ke >= 4 && (!log.status_lulus || log.status_lulus === "0") && (
                            <span className="ml-2 inline-block bg-red-100 text-red-600 text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">
                              ⚠️ BANTU
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 md:p-5">
                          <div className="truncate max-w-[200px] xl:max-w-md bg-white/50 dark:bg-black/30 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border border-white/50 dark:border-white/5 font-mono text-[11px] md:text-[13px] text-slate-700 dark:text-slate-300" title={log.input_verbal || log.input_kode}>
                            {log.input_verbal || log.input_kode || "Tidak ada input"}
                          </div>
                        </td>
                        <td className="px-4 py-3 md:p-5">
                          {log.status_lulus 
                            ? <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold w-fit"><CheckCircle2 size={14}/> LULUS</span> 
                            : <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-200/50 dark:border-amber-800/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold w-fit"><XCircle size={14}/> REVISI</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

            ) : (
              
              <table className="w-full text-left text-[12px] md:text-sm whitespace-nowrap">
                <thead className="bg-white/30 dark:bg-black/20 text-slate-600 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider border-b border-white/50 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3 md:p-5 font-semibold">Waktu Selesai</th>
                    <th className="px-4 py-3 md:p-5 font-semibold">Identitas Siswa</th>
                    <th className="px-4 py-3 md:p-5 font-semibold">Mata Pelajaran / Modul</th>
                    <th className="px-4 py-3 md:p-5 font-semibold text-center">Skor Akhir</th>
                    <th className="px-4 py-3 md:p-5 font-semibold">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50 dark:divide-white/5">
                  {dataKuis.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 md:p-10 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada siswa yang menyelesaikan kuis.</td></tr>
                  ) : (
                    dataKuis.map((kuis, i) => (
                      <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 md:p-5 text-slate-600 dark:text-slate-400">{new Date(kuis.waktu_selesai).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="px-4 py-3 md:p-5">
                          <div className="font-bold text-slate-900 dark:text-white">{kuis.nama}</div>
                          <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">{kuis.kelas || 'Tanpa Kelas'}</div>
                        </td>
                        <td className="px-4 py-3 md:p-5 text-slate-700 dark:text-slate-300 font-medium">Modul 1: Algoritma Dasar</td>
                        <td className="px-4 py-3 md:p-5 text-center">
                          <span className={`text-base md:text-lg font-black ${kuis.skor >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {kuis.skor}
                          </span>
                        </td>
                        <td className="px-4 py-3 md:p-5">
                          {kuis.skor >= 70 
                            ? <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/40 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold">TERCAPAI</span>
                            : <span className="text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/40 border border-red-200/50 dark:border-red-800/50 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold">REMEDIAL</span>
                          }
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

    </div>
  );
}