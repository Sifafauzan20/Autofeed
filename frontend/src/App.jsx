import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import LayoutSiswa from './layouts/LayoutSiswa';
import LayoutGuru from './layouts/LayoutGuru';
import Login from './pages/Login';
import WorkspacePBL from './pages/siswa/WorkspacePBL';
import Materi from './pages/siswa/Materi';
import Kuis from './pages/siswa/Kuis';
import UjianSiswa from './pages/siswa/UjianSiswa';
import DashboardGuru from './pages/guru/DashboardGuru';
import ManajemenModul from './pages/guru/ManajemenModul';
import DashboardSiswa from './pages/siswa/DashboardSiswa';
import HasilPengerjaan from './pages/guru/HasilPengerjaan';
import PengaturanUjian from './pages/guru/PengaturanUjian';
import { Toaster } from 'react-hot-toast';

// ==========================================
// KOMPONEN SATPAM (Sistem Keamanan Rute)
// ==========================================
const ProtectedRoute = ({ allowedRole }) => {
  // 1. Cek apakah ada data user di memori browser
  const userString = localStorage.getItem('authUser');
  
  // Jika tidak ada data login sama sekali, tendang ke halaman Login
  if (!userString) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userString);

  // 2. Cek apakah role-nya sesuai dengan jalur yang diminta
  // Misal: user rolenya "Siswa", tapi mencoba akses allowedRole "Guru"
  if (allowedRole && user.role !== allowedRole) {
    // Tendang balik ke rute yang seharusnya sesuai role mereka
    if (user.role === 'Siswa') return <Navigate to="/siswa/materi" replace />;
    if (user.role === 'Guru') return <Navigate to="/guru/dashboard" replace />;
  }

  // 3. Jika aman dan role sesuai, silakan masuk (render komponen yang diminta)
  return <Outlet />;
};

// ==========================================
// ROUTER UTAMA
// ==========================================
function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Rute Bebas (Bisa diakses siapa saja) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* RUTE KHUSUS SISWA (Dilindungi Satpam Siswa) */}
        <Route element={<ProtectedRoute allowedRole="Siswa" />}>
          <Route path="/siswa" element={<LayoutSiswa />}>
            {/* PASTIKAN BARIS INI TEPAT SEPERTI INI */}
            <Route index element={<Navigate to="/siswa/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardSiswa />} />
            <Route path="materi" element={<Materi />} />
            <Route path="kuis" element={<Kuis />} />
            <Route path="pbl" element={<WorkspacePBL />} />
            <Route path="ujian/:tipeUjian" element={<UjianSiswa />} />
          </Route>
        </Route>

        {/* RUTE KHUSUS GURU (Dilindungi Satpam Guru) */}
        <Route element={<ProtectedRoute allowedRole="Guru" />}>
          <Route path="/guru" element={<LayoutGuru />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardGuru />} />
            <Route path="manajemen" element={<ManajemenModul />} />
            <Route path="hasil-pbl" element={<HasilPengerjaan />} /> 
            <Route path="pengaturan-ujian" element={<PengaturanUjian />} />
          </Route>
        </Route>
        
        {/* Tangkap URL ngawur (404), kembalikan ke Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;