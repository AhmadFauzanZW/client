// src/pages/DirekturDashboard.jsx
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axiosInstance from "../api/axiosInstance.js";
import StatCard from '../components/StatCard';
import { Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import { id as indonesianLocale } from 'date-fns/locale';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DirekturDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [izinUntukValidasi, setIzinUntukValidasi] = useState([]);
    const [periode, setPeriode] = useState(new Date());

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            try {
                const params = { periode: periode.toISOString().slice(0, 7) };
                const { data } = await axiosInstance.get('/dashboard/direktur', { headers, params });
                setDashboardData(data);
            } catch (error) {
                console.error("Gagal memuat data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [periode]);

    // Fetch logs
    useEffect(() => {
        const fetchLogData = async () => {
            try {
                const token = localStorage.getItem('token');
                // Kita juga akan langsung implementasi paginasi di sini
                const response = await axiosInstance.get('/logs', {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 1, limit: 7 } // Ambil 7 log terbaru untuk tampilan awal
                });
                // Ambil hanya array 'logs' dari dalam objek response
                setLogs(response.data.logs);
                // Simpan juga data paginasinya jika perlu
                // setLogPagination(response.data.pagination);
            } catch (error) {
                console.error("Gagal mengambil log aktivitas:", error);
            }
        };
        fetchLogData();
    }, []);

    // Fetch izin untuk validasi
    useEffect(() => {
        const fetchIzinData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axiosInstance.get('/izin/validasi', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIzinUntukValidasi(response.data);
            } catch (error) {
                console.error("Gagal mengambil data validasi izin:", error);
            }
        };
        fetchIzinData();
    }, []);

    // Handle izin approval
    const handleAction = async (id_pengajuan, aksi) => {
        let catatan = '';
        if (aksi === 'tolak') {
            let alasan = '';
            do {
                alasan = window.prompt('Mohon masukkan alasan penolakan:');
                if (alasan === null) return;
            } while (!alasan.trim());
            catatan = alasan;
        } else {
            const catatanOpsional = window.prompt('Tambahkan catatan (opsional):', 'Disetujui');
            if (catatanOpsional === null) return;
            catatan = catatanOpsional;
        }
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put(`/izin/${id_pengajuan}/proses`, { aksi, catatan }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchIzinData(); // Refresh list
        } catch (error) {
            alert(`Gagal memproses. ${error.response?.data?.message || ''}`);
        }
    };

    if (loading) return <Layout><p className="p-6">Memuat Dasbor Direktur...</p></Layout>;
    if (!dashboardData) return <Layout><p className="p-6 text-red-500">Gagal memuat data dasbor.</p></Layout>;

    const { kpis, biayaChart } = dashboardData;

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Direktur</h1>
                <div>
                    <label className="text-sm mr-2">Pilih Bulan:</label>
                    <DatePicker
                        selected={periode}
                        onChange={(date) => setPeriode(date)}
                        dateFormat="MMMM yyyy"
                        showMonthYearPicker
                        locale={indonesianLocale}
                        className="p-2 border rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Biaya Gaji"
                    value={`Rp ${(kpis.total_biaya_gaji.value / 1000000).toFixed(1)} Jt`}
                    icon="💰"
                    change={kpis.total_biaya_gaji.change}
                />
                <StatCard
                    title="Produktivitas Rata-rata"
                    value={parseFloat(kpis.produktivitas_rata_rata.value).toFixed(1)}
                    unit=" Jam/Hari"
                    icon="📈"
                    change={kpis.produktivitas_rata_rata.change}
                />
                <StatCard
                    title="Tingkat Absensi"
                    value={parseFloat(kpis.tingkat_absensi.value).toFixed(1)}
                    unit="%"
                    icon="📉"
                    change={kpis.tingkat_absensi.change * -1}
                />
            </div>

            {/* Persetujuan Izin */}
            <div className="bg-white p-6 mb-6 rounded-lg shadow-md">
                <h3 className="font-medium mb-2">Persetujuan Izin</h3>
                {izinUntukValidasi.length > 0 ? (
                    <ul className="space-y-2">
                        {izinUntukValidasi.map((izin, index) => (
                            <li key={index} className="bg-gray-50 p-3 rounded">
                                <div className="font-medium">{izin.nama_pengguna} - {izin.jenis_izin}</div>
                                <div className="text-sm text-gray-500">{izin.alasan}</div>
                                <div className="mt-2 flex space-x-2">
                                    <button
                                        onClick={() => handleAction(izin.id_pengajuan, 'setuju')}
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Setujui
                                    </button>
                                    <button
                                        onClick={() => handleAction(izin.id_pengajuan, 'tolak')}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic">Tidak ada pengajuan izin yang perlu diverifikasi.</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Biaya Gaji per Proyek (Bulan Dipilih)</h2>
                    <div className="h-80">
                        <Bar options={{ responsive: true, maintainAspectRatio: false }} data={biayaChart} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Log Aktivitas & Persetujuan Izin</h2>

                    {/* Log Aktivitas */}
                    <div className="mb-6">
                        <h3 className="font-medium mb-2">Log Aktivitas Pengguna</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b-2 border-gray-200">
                                <tr>
                                    <th className="py-2">Waktu</th>
                                    <th className="py-2">Pengguna</th>
                                    <th className="py-2">Aksi</th>
                                    <th className="py-2">Deskripsi</th>
                                </tr>
                                </thead>
                                <tbody>
                                {logs.length > 0 ? (
                                    logs.map((log, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {new Date(log.waktu_aktivitas).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {log.nama_pengguna || log.user} ({log.nama_peran || log.role})
                                            </td>
                                            <td className="py-2 pr-4">
                                                    <span className="bg-gray-200 px-2 py-1 rounded-full text-xs">
                                                        {log.tipe_aktivitas || log.action}
                                                    </span>
                                            </td>
                                            <td className="py-2">{log.deskripsi || log.description}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-500">
                                            Tidak ada log aktivitas.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DirekturDashboard;