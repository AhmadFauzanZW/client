import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Jangan lupa import CSS
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Komponen Kartu Statistik (seperti di SupervisorDashboard)
const StatCard = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md text-center ${color}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
);

// Komponen Badge Status Berwarna
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Hadir': return 'bg-green-100 text-green-800';
      case 'Telat': return 'bg-yellow-100 text-yellow-800';
      case 'Izin': return 'bg-cyan-100 text-cyan-800';
      case 'Lembur': return 'bg-indigo-100 text-indigo-800';
      case 'Pulang Cepat': return 'bg-orange-100 text-orange-800';
      case 'Absen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>{status}</span>;
};


const PekerjaProfile = () => {
  const { user } = useAuth();
  // State untuk data utama
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('bulan');

  // --- STATE BARU UNTUK RIWAYAT INTERAKTIF ---
  const [viewMode, setViewMode] = useState('list'); // 'list' atau 'calendar'
  const [history, setHistory] = useState({ activities: [], pagination: {} });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);

  // --- FUNGSI BARU UNTUK MENGAMBIL DATA RIWAYAT ---
  const fetchHistory = useCallback(async (page, mode) => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      let params = {};
      if (mode === 'list') {
        params = { page, limit: 7 }; // Paginasi per 7 hari (mingguan)
      } else { // mode 'calendar'
        params = { month: format(calendarDate, 'yyyy-MM') };
      }

      const res = await axiosInstance.get('/pekerja/history', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (mode === 'list') {
        setHistory(res.data);
      } else {
        setCalendarData(res.data.activities);
      }

    } catch (err) {
      console.error("Gagal mengambil data riwayat:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [calendarDate]); // Dependensi pada calendarDate untuk fetch ulang saat bulan ganti

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axiosInstance.get('/pekerja/profil', {
          headers: { Authorization: `Bearer ${token}` },
          params: { filter }
        });
        setProfileData(res.data);
      } catch (err) {
        setError('Gagal memuat data profil.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, filter]);

  // Fetch data riwayat sesuai viewMode dan halaman
  useEffect(() => {
    if (viewMode === 'list') {
      fetchHistory(currentPage, 'list');
    } else { // 'calendar'
      fetchHistory(1, 'calendar');
    }
  }, [viewMode, currentPage, fetchHistory]);

  if (loading) return <Layout><div className="text-center p-10">Memuat data profil...</div></Layout>;
  if (error) return <Layout><div className="text-center p-10 text-red-500">{error}</div></Layout>;
  if (!profileData) return <Layout><div className="text-center p-10">Tidak ada data untuk ditampilkan.</div></Layout>;

  const { profileInfo, payrollInfo, attendanceSummary, attendanceChartData, performanceChartData, recentActivities } = profileData;

  // --- FUNGSI UNTUK MEWARNAI KALENDER ---
  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateString = format(date, 'yyyy-MM-dd');
      const record = calendarData.find(d => d.tanggal === dateString);
      if (record) {
        return record.status_kehadiran.toLowerCase().replace(' ', '-');
      }
    }
    return '';
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, // --- MENAMPILKAN LEGEND ---
        position: 'top',
      },
    },
  };

  const pieData = {
    labels: attendanceChartData.labels,
    datasets: attendanceChartData.datasets,
  };

  // --- RENDER KOMPONEN UTAMA ---
  return (
      <Layout>
        {/* Header Profil */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex items-center gap-6">
          <img
              src={profileInfo.foto_profil_path ? `http://localhost:5000/uploads/${profileInfo.foto_profil_path}` : 'https://placehold.co/100x100'}
              alt="Foto Profil"
              className="w-24 h-24 rounded-full border-4 border-blue-200 object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{profileInfo.nama_pengguna}</h1>
            <p className="text-lg text-gray-600">{profileInfo.nama_pekerjaan}</p>
            <p className="text-sm text-gray-500">ID: {profileInfo.id_pekerja}</p>
          </div>
        </div>

        {/* Tombol Filter Mingguan/Bulanan */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setFilter('minggu')} className={`px-4 py-2 text-sm rounded ${filter === 'minggu' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Mingguan</button>
            <button onClick={() => setFilter('bulan')} className={`px-4 py-2 text-sm rounded ${filter === 'bulan' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Bulanan</button>
          </div>
        </div>

        {/* Grid Utama */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Kolom Kiri */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            {/* Kalkulasi Gaji */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Estimasi Pendapatan ({filter === 'minggu' ? 'Minggu Ini' : 'Bulan Ini'})</h3>
              <p className="text-4xl font-bold text-green-600">Rp {Math.round(payrollInfo.totalEstimasiGaji).toLocaleString('id-ID')}</p>
              <div className="text-sm text-gray-500 mt-2 space-y-1">
                <p>Gaji Pokok: Rp {Math.round(payrollInfo.estimasiGajiPokok).toLocaleString('id-ID')}</p>
                <p>Gaji Lembur: Rp {Math.round(payrollInfo.estimasiGajiLembur).toLocaleString('id-ID')} ({payrollInfo.totalJamLembur})</p>
                <p className="font-semibold pt-2">Gajian Berikutnya: {payrollInfo.tanggalGajian}</p>
              </div>
            </div>

            {/* Ringkasan Kehadiran */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-4">Ringkasan Kehadiran ({filter === 'minggu' ? 'Mingguan' : 'Bulanan'})</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Hadir" value={attendanceSummary.Hadir} color="bg-green-100" />
                <StatCard title="Telat" value={attendanceSummary.Telat} color="bg-yellow-100" />
                <StatCard title="Izin" value={attendanceSummary.Izin} color="bg-cyan-100" />
                <StatCard title="Absen" value={attendanceSummary.Absen} color="bg-red-100" />
                <StatCard title="Lembur" value={attendanceSummary.Lembur} color="bg-indigo-100" />
                <StatCard title="Pulang Cepat" value={attendanceSummary['Pulang Cepat']} color="bg-orange-100" />
              </div>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Grafik Kehadiran Pie & Performa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-4">Distribusi Kehadiran</h3>
                <div className="h-64">
                  <Pie options={pieOptions} data={pieData} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-lg mb-4">Performa Jam Kerja</h3>
                <div className="h-64">
                  {performanceChartData.type === 'bar' && <Bar options={{ responsive: true, maintainAspectRatio: false }} data={{ labels: performanceChartData.labels, datasets: performanceChartData.datasets }} />}
                  {performanceChartData.type === 'line' && <Line options={{ responsive: true, maintainAspectRatio: false }} data={{ labels: performanceChartData.labels, datasets: performanceChartData.datasets }} />}
                </div>
              </div>
            </div>

            {/* Riwayat Kehadiran */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="font-semibold text-lg">Riwayat Kehadiran</h3>
                <div className='flex items-center space-x-2'>
                  <span className="text-sm font-medium">Tampilan:</span>
                  <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Daftar
                  </button>
                  <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm rounded ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    Kalender
                  </button>
                </div>
              </div>

              {historyLoading ? <div className="text-center p-4">Memuat riwayat...</div> : (
                  viewMode === 'list' ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                            <tr className="border-b-2">
                              <th className="py-2">Tanggal</th>
                              <th className="py-2">Jam Masuk</th>
                              <th className="py-2">Jam Keluar</th>
                              <th className="py-2">Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {history.activities.length > 0 ? history.activities.map((h, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                  <td className="py-3">{format(new Date(h.tanggal), 'eeee, dd MMM yyyy', { locale: id })}</td>
                                  <td>{h.jam_masuk || '-'}</td>
                                  <td>{h.jam_keluar || '-'}</td>
                                  <td><StatusBadge status={h.status_kehadiran} /></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center py-4 text-gray-500">Tidak ada data.</td></tr>
                            )}
                            </tbody>
                          </table>
                        </div>
                        {history.pagination && history.pagination.totalPages > 1 && (
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Sebelumnya</button>
                              <span className="text-sm text-gray-600">Halaman {currentPage} dari {history.pagination.totalPages}</span>
                              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === history.pagination.totalPages} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Berikutnya</button>
                            </div>
                        )}
                      </>
                  ) : (
                      <Calendar
                          locale="id-ID"
                          activeStartDate={calendarDate}
                          onActiveStartDateChange={({ activeStartDate }) => setCalendarDate(activeStartDate)}
                          tileClassName={getTileClassName}
                      />
                  )
              )}
            </div>
          </div>
        </div>
      </Layout>
  );
};

export default PekerjaProfile;