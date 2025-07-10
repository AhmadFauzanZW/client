// Statistik Dashboard Utama
export const dashboardSummary = {
  totalPekerja: 15,
  hadir: 12,
  terlambat: 2,
  absen: 1,
};

// Daftar Pekerja dengan informasi detail (login, role, gaji, dll)
export const daftarPekerja = [
  {
    id: 'P001',
    nama: 'Budi Santoso',
    jabatan: 'Tukang Batu',
    role: 'Pekerja',
    password: 'budi123',
    gaji_harian: 150000,
    foto_profil: 'https://placehold.co/100x100/E2E8F0/4A5568?text=BS',
  },
  {
    id: 'P002',
    nama: 'Joko Susilo',
    jabatan: 'Tukang Las',
    role: 'Pekerja',
    password: 'joko123',
    gaji_harian: 160000,
    foto_profil: 'https://placehold.co/100x100/E2E8F0/4A5568?text=JS',
  },
  {
    id: 'P003',
    nama: 'Agus Wijaya',
    jabatan: 'Kernet',
    role: 'Pekerja',
    password: 'agus123',
    gaji_harian: 130000,
    foto_profil: 'https://placehold.co/100x100/E2E8F0/4A5568?text=AW',
  },
  {
    id: 'P004',
    nama: 'Eko Prasetyo',
    jabatan: 'Chief Technical Officer',
    role: 'Direktur',
    password: 'eko123',
    gaji_harian: 500000,
    foto_profil: 'https://placehold.co/100x100/E2E8F0/4A5568?text=EP',
  },
  {
    id: 'P005',
    nama: 'Slamet Riyadi',
    jabatan: 'Mandor',
    role: 'Manager',
    password: 'slamet123',
    gaji_harian: 250000,
    foto_profil: 'https://placehold.co/100x100/E2E8F0/4A5568?text=SR',
  },
  {
    id: 'P006',
    nama: 'Hari Sasmito',
    jabatan: 'Pengawas Lapangan',
    role: 'Supervisor',
    password: 'hari123',
    gaji_harian: 250000,
    foto_profil: 'https://placehold.co/100x100/E2E8F0/4A5568?text=HS',
  },
];

// Kehadiran Harian Semua Pekerja
export const getInitialAttendanceList = () => [
  { id: 'P001', nama: 'Budi Santoso', jabatan: 'Tukang Batu', status: 'Hadir' },
  { id: 'P002', nama: 'Joko Susilo', jabatan: 'Tukang Las', status: 'Terlambat' },
  { id: 'P003', nama: 'Agus Wijaya', jabatan: 'Kernet', status: 'Absen' },
  { id: 'P004', nama: 'Rizky Pramudya', jabatan: 'Tukang Batu', status: 'Terlambat' },
  { id: 'P005', nama: 'Slamet Riyadi', jabatan: 'Mandor', status: 'Belum Hadir' },
  { id: 'P006', nama: 'Dewi Lestari', jabatan: 'Pengawas K3', status: 'Belum Hadir' },
  { id: 'P007', nama: 'Citra Kirana', jabatan: 'Arsitek Lapangan', status: 'Belum Hadir' },
];

// Catatan Kehadiran Hari Ini
export const catatanKehadiranHariIni = [
  { id: 1, pekerjaId: 'P001', nama: 'Budi Santoso', tanggal: '2025-06-25', jamMasuk: '07:55', status: 'Hadir' },
  { id: 2, pekerjaId: 'P002', nama: 'Joko Susilo', tanggal: '2025-06-25', jamMasuk: '08:10', status: 'Terlambat' },
  { id: 3, pekerjaId: 'P003', nama: 'Agus Wijaya', tanggal: '2025-06-25', jamMasuk: '07:58', status: 'Absen' },
  { id: 4, pekerjaId: 'P004', nama: 'Rizky Pramudya', tanggal: '2025-06-25', jamMasuk: '08:00', status: 'Terlambat' },
];

// Pengajuan Izin oleh Pekerja
export const pengajuanIzinList = [
  {
    id: 'IZN001',
    pekerjaId: 'P003',
    namaPekerja: 'Agus Wijaya',
    tanggalMulai: '2025-06-26',
    tanggalSelesai: '2025-06-26',
    alasan: 'Keperluan keluarga mendadak, mengantar orang tua ke rumah sakit.',
    lampiranUrl: 'https://drive.google.com/file/d/1WI51zwJ3fkG0I9UhBQyqVkvq6Gpc7dOh/view?usp=sharing',
    status: 'Menunggu Persetujuan',
  },
  {
    id: 'IZN002',
    pekerjaId: 'P002',
    namaPekerja: 'Joko Susilo',
    tanggalMulai: '2025-06-27',
    tanggalSelesai: '2025-06-28',
    alasan: 'Sakit, butuh istirahat sesuai anjuran dokter.',
    lampiranUrl: 'https://drive.google.com/file/d/1bBqgtL3HuuRwymFJoPl4IFfMXGe7O0Qj/view?usp=sharing',
    status: 'Disetujui',
  },
  {
    id: 'IZN003',
    pekerjaId: 'P001',
    namaPekerja: 'Budi Santoso',
    tanggalMulai: '2025-06-25',
    tanggalSelesai: '2025-06-25',
    alasan: 'Acara wisuda adik.',
    lampiranUrl: null,
    status: 'Ditolak',
  },
];

// Riwayat Kehadiran untuk satu pekerja (misal: Budi Santoso - P001)
export const riwayatKehadiranPekerja = [
  { tanggal: '2025-06-24', jamMasuk: '07:55', jamKeluar: '17:02', status: 'Hadir' },
  { tanggal: '2025-06-23', jamMasuk: '08:10', jamKeluar: '17:00', status: 'Terlambat' },
  { tanggal: '2025-06-22', jamMasuk: '07:58', jamKeluar: '17:05', status: 'Hadir' },
  { tanggal: '2025-06-21', jamMasuk: null, jamKeluar: null, status: 'Absen' },
  { tanggal: '2025-06-20', jamMasuk: '08:00', jamKeluar: '17:00', status: 'Hadir' },
];

// Lokasi Proyek
export const lokasiProyekList = [
  { id: 'LOK01', nama: 'Proyek Jembatan Suramadu Ext.' },
  { id: 'LOK02', nama: 'Proyek Apartemen Grand City' },
];

// Log Aktivitas Sistem
export const logAktivitas = [
  {
    timestamp: '2025-06-25 10:05:12',
    user: 'Hari Sasmito',
    role: 'Supervisor',
    action: 'LOGIN',
    description: 'User login dari IP 103.45.21.8'
  },
  {
    timestamp: '2025-06-25 10:07:34',
    user: 'Hari Sasmito',
    role: 'Supervisor',
    action: 'ABSENSI',
    description: 'Mencatat kehadiran Budi Santoso sebagai Hadir'
  },
  {
    timestamp: '2025-06-25 11:15:01',
    user: 'Agus Wijaya',
    role: 'Pekerja',
    action: 'PENGAJUAN_IZIN',
    description: 'Mengajukan izin untuk tanggal 2025-06-26'
  },
  {
    timestamp: '2025-06-25 11:20:45',
    user: 'Slamet Riyadi',
    role: 'Manager',
    action: 'PERSETUJUAN_IZIN',
    description: 'Menyetujui izin IZN002 untuk Joko Susilo dari 2025-06-27 sampai 2025-06-28'
  },
];