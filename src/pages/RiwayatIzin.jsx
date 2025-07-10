import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Layout from '../components/Layout';
import StatusPersetujuan from '../components/StatusPersetujuan';

const RiwayatIzin = () => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axiosInstance.get('/izin/riwayat', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setHistoryList(response.data);
            } catch (error) {
                console.error("Gagal mengambil riwayat izin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusChip = (status) => {
        switch (status) {
            case 'Disetujui': return 'bg-green-100 text-green-800';
            case 'Ditolak': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    if (loading) return <Layout><p>Loading riwayat...</p></Layout>;

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Riwayat Pengajuan Izin</h1>
            <div className="space-y-4">
                {historyList.length > 0 ? historyList.map((item) => (
                    <div key={item.id_pengajuan} className="bg-white p-5 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-lg text-gray-800">{item.nama_pemohon || 'Pengajuan Anda'}</p>
                                <p className="text-sm text-gray-500">Jenis: {item.jenis_izin}</p>
                                <p className="text-sm text-gray-500">{new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} - {new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}</p>
                            </div>
                            <StatusPersetujuan status={item.status_akhir} />
                        </div>
                        <p className="mt-3 text-gray-700 text-sm">Alasan: {item.keterangan}</p>
                        {item.approval_logs && (
                            <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                                <p className="font-semibold">Log Persetujuan:</p>
                                <ul className="list-disc list-inside">
                                    {item.approval_logs.split('; ').map((log, index) => <li key={index}>{log}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )) : <p>Tidak ada riwayat pengajuan izin.</p>}
            </div>
        </Layout>
    );
};

export default RiwayatIzin;