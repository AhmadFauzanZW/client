// src/pages/SupervisorDashboard.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance'; // Tetap gunakan axiosInstance
import Layout from '../components/Layout';
import { StatCardSpv } from '../components/StatCard';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { id as indonesianLocale } from 'date-fns/locale';

import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Komponen Grafik Dinamis (tidak berubah, diambil dari kode lama)
const DynamicChart = ({ chartData }) => {
    if (!chartData || !chartData.type) return <div className="h-full flex justify-center items-center text-gray-400">Pilih filter untuk melihat grafik...</div>;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false },
        },
        scales: (chartData.type === 'bar' || chartData.type === 'line') ? {
            x: { stacked: chartData.type === 'bar' },
            y: { stacked: chartData.type === 'bar', beginAtZero: true }
        } : undefined,
    };

    const data = {
        labels: chartData.labels,
        datasets: chartData.datasets,
    };

    if (chartData.type === 'bar') return <Bar options={options} data={data} />;
    if (chartData.type === 'line') return <Line options={options} data={data} />;
    if (chartData.type === 'pie') return <Pie options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} data={data} />;
    return null;
};


const SupervisorDashboard = () => {
    // State dari kode lama
    const [summary, setSummary] = useState({});
    const [trendData, setTrendData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [displayPeriod, setDisplayPeriod] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('hari');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // --- STATE BARU UNTUK FILTER LOKASI ---
    const [lokasiList, setLokasiList] = useState([]);
    const [selectedLokasi, setSelectedLokasi] = useState('semua'); // 'semua' sebagai nilai default

    // EFEK BARU: Fetch daftar lokasi saat komponen pertama kali dimuat
    useEffect(() => {
        const fetchLokasi = async () => {
            try {
                const token = localStorage.getItem('token');
                // Menggunakan endpoint dari kode baru untuk mengambil lokasi supervisor
                const { data } = await axiosInstance.get('/proyek/supervisor-assignments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLokasiList(data);
            } catch (err) {
                console.error("Gagal mengambil daftar lokasi", err);
                // Opsi: setError('Gagal memuat filter lokasi.');
            }
        };
        fetchLokasi();
    }, []); // Hanya berjalan sekali

    // EFEK UTAMA: Fetch data dashboard, sekarang tergantung juga pada 'selectedLokasi'
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Parameter disatukan dan ditambahkan 'lokasi'
                const params = {
                    filter,
                    date: selectedDate.toISOString().split('T')[0],
                    page: pagination.currentPage,
                    // Gunakan 'lokasi' sesuai backend, kirim null jika 'semua'
                    lokasi: selectedLokasi === 'semua' ? null : selectedLokasi,
                };

                // Panggil endpoint dengan parameter yang sudah lengkap
                const summaryPromise = axiosInstance.get('/dashboard/summary', { headers, params });
                const activitiesPromise = axiosInstance.get('/dashboard/activities', { headers, params });

                const [summaryRes, activitiesRes] = await Promise.all([summaryPromise, activitiesPromise]);

                setSummary(summaryRes.data.summary);
                setTrendData(summaryRes.data.trendData);
                setDisplayPeriod(summaryRes.data.displayPeriod);
                setActivities(activitiesRes.data.activities);
                setPagination(activitiesRes.data.pagination);
            } catch (err) {
                console.error('Gagal mengambil data dashboard:', err);
                setError('Gagal memuat data. Silakan coba lagi.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, selectedDate, selectedLokasi, pagination.currentPage]); // Tambahkan selectedLokasi di dependency array

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setSelectedDate(new Date());
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // --- HANDLER BARU UNTUK LOKASI ---
    const handleLokasiChange = (e) => {
        setSelectedLokasi(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset halaman saat filter berubah
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Supervisor</h1>
                    <p className="text-gray-500 mt-1">Menampilkan data untuk: <span className="font-semibold text-blue-600">{displayPeriod}</span></p>
                </div>
                <Link to="/supervisor/absensi" className="w-full md:w-auto order-first md:order-last bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg text-center">
                    Mulai Sesi Absensi
                </Link>
            </div>

            {/* Kontrol Filter dengan tambahan filter lokasi */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                {/* Filter Lokasi */}
                {lokasiList.length > 0 && (
                    <div className="flex-grow w-full sm:w-auto">
                        <label htmlFor="lokasi-filter" className="text-sm font-medium sr-only">Lokasi</label>
                        <select id="lokasi-filter" onChange={handleLokasiChange} value={selectedLokasi} className="w-full p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option value="semua">Semua Lokasi</option>
                            {lokasiList.map(l => <option key={l.id_lokasi} value={l.id_lokasi}>{l.nama_lokasi}</option>)}
                        </select>
                    </div>
                )}
                <div className="flex gap-2">
                    {/* Filter Tanggal */}
                    <div className="w-full sm:w-auto">
                        <DatePicker selected={selectedDate} onChange={handleDateChange} dateFormat={filter === 'bulan' ? 'MMMM yyyy' : 'dd MMMM yyyy'} showMonthYearPicker={filter === 'bulan'} locale={indonesianLocale} className="w-full p-2 border border-gray-300 rounded-lg text-center bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    {/* Filter Periode */}
                    <button onClick={() => handleFilterChange('hari')} className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${filter === 'hari' ? 'bg-blue-600 text-white shadow' : 'bg-white border'}`}>Harian</button>
                    <button onClick={() => handleFilterChange('minggu')} className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${filter === 'minggu' ? 'bg-blue-600 text-white shadow' : 'bg-white border'}`}>Mingguan</button>
                    <button onClick={() => handleFilterChange('bulan')} className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer ${filter === 'bulan' ? 'bg-blue-600 text-white shadow' : 'bg-white border'}`}>Bulanan</button>
                </div>
            </div>

            {/* Kartu Statistik menggunakan grid untuk responsivitas yang lebih baik */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <StatCardSpv title="Total Aktif" value={summary.total_pekerja ?? 0} icon="👥" />
                <StatCardSpv title="Hadir" value={summary.hadir ?? 0} icon="✅" />
                <StatCardSpv title="Terlambat" value={summary.terlambat ?? 0} icon="⚠️" />
                <StatCardSpv title="Izin" value={summary.izin ?? 0} icon="📝" />
                <StatCardSpv title="Lembur" value={summary.lembur ?? 0} icon="💼" />
                <StatCardSpv title="Pulang Cepat" value={summary.pulang_cepat ?? 0} icon="🏃‍♂️" />
                <StatCardSpv title="Absen" value={summary.absen ?? 0} icon="❌" />
            </div>

            <div className="flex flex-col gap-6">
                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md w-full">
                    <h2 className="text-xl font-semibold mb-4">{trendData?.title || 'Grafik Kehadiran'}</h2>
                    <div className="h-80">
                        {loading ? <div className="text-center p-4">Memuat grafik...</div> : <DynamicChart chartData={trendData} />}
                    </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Aktivitas Kehadiran Terbaru</h2>
                    {loading && <div className="text-center p-4">Memuat aktivitas...</div>}
                    {!loading && error && <div className="text-center p-4 text-red-500">{error}</div>}
                    {!loading && !error && (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b-2 border-gray-200">
                                    <tr>
                                        <th className="py-2 px-3">Nama Pekerja</th>
                                        <th className="py-2 px-3">Tanggal</th>
                                        <th className="py-2 px-3">Jam Masuk</th>
                                        <th className="py-2 px-3">Jam Pulang</th>
                                        <th className="py-2 px-3">Total Jam Kerja</th>
                                        <th className="py-2 px-3">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {activities.length > 0 ? (
                                        activities.map((activity, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-3 font-medium">{activity.nama_pengguna}</td>
                                                <td className="py-3 px-3 text-gray-600">{activity.tanggal}</td>
                                                <td className="py-3 px-3 text-gray-600">{activity.jam_masuk || '-'}</td>
                                                <td className="py-3 px-3 text-gray-600">{activity.jam_pulang || '-'}</td>
                                                <td className="py-3 px-3 font-semibold">{activity.total_jam_kerja || '-'}</td>
                                                <td className="py-3 px-3">
                                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                          activity.status_kehadiran === 'Hadir' ? 'bg-green-100 text-green-800' :
                                                              activity.status_kehadiran === 'Telat' ? 'bg-yellow-100 text-yellow-800' :
                                                                  activity.status_kehadiran === 'Izin' ? 'bg-cyan-100 text-cyan-800' :
                                                                      activity.status_kehadiran === 'Lembur' ? 'bg-indigo-100 text-indigo-800' :
                                                                          activity.status_kehadiran === 'Pulang Cepat' ? 'bg-orange-100 text-orange-800' :
                                                                              activity.status_kehadiran === 'Absen' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                                                      >
                                                          {activity.status_kehadiran}
                                                      </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-6 text-gray-500">Tidak ada data kehadiran untuk periode dan lokasi ini.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                    <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300">Sebelumnya</button>
                                    <span className="text-sm text-gray-600">Halaman {pagination.currentPage} dari {pagination.totalPages}</span>
                                    <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300">Berikutnya</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SupervisorDashboard;