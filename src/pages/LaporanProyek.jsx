// src/pages/LaporanProyek.jsx

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axiosInstance from '../api/axiosInstance';
import DatePicker from 'react-datepicker';
import { saveAs } from 'file-saver';

const LaporanProyek = () => {
    const [filters, setFilters] = useState({
        reportType: 'kehadiran',
        lokasiId: '',
        periode: new Date()
    });
    const [metaData, setMetaData] = useState({ lokasi: [] });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch metadata (daftar lokasi) saat komponen pertama kali dimuat
    useEffect(() => {
        const fetchMeta = async () => {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/manajemen/meta-data', { headers: { Authorization: `Bearer ${token}` } });
            setMetaData(data);
            if (data.lokasi.length > 0) {
                setFilters(prev => ({ ...prev, lokasiId: data.lokasi[0].id_lokasi }));
            }
        };
        fetchMeta();
    }, []);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateReport = async (exportToFile = false) => {
        if (!filters.lokasiId) {
            alert("Silakan pilih lokasi proyek.");
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const body = {
                ...filters,
                periode: filters.periode.toISOString().slice(0, 7), // Format YYYY-MM
                export: exportToFile
            };

            const config = {
                headers: { Authorization: `Bearer ${token}` },
                // Penting: ubah responseType jika ingin mengunduh file
                responseType: exportToFile ? 'blob' : 'json'
            };

            const response = await axiosInstance.post('/laporan/generate', body, config);

            if (exportToFile) {
                saveAs(response.data, `laporan_${filters.reportType}_${body.periode}.xlsx`);
            } else {
                setReportData(response.data);
            }

        } catch (error) {
            console.error("Gagal membuat laporan:", error);
            alert("Gagal membuat laporan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <h1 className="text-3xl font-bold mb-6">Buat Laporan</h1>

            {/* Filter Section */}
            <div className="p-6 bg-white rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium">Jenis Laporan</label>
                        <select name="reportType" value={filters.reportType} onChange={handleFilterChange} className="w-full p-2 border rounded mt-1">
                            <option value="kehadiran">Kehadiran Detail</option>
                            <option value="gaji">Rekapitulasi Gaji</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Lokasi Proyek</label>
                        <select name="lokasiId" value={filters.lokasiId} onChange={handleFilterChange} className="w-full p-2 border rounded mt-1">
                            <option value="">Pilih Lokasi</option>
                            {metaData.lokasi.map(l => <option key={l.id_lokasi} value={l.id_lokasi}>{l.nama_lokasi}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Periode (Bulan & Tahun)</label>
                        <DatePicker selected={filters.periode} onChange={date => setFilters(prev => ({...prev, periode: date}))} dateFormat="MMMM yyyy" showMonthYearPicker className="w-full p-2 border rounded mt-1" />
                    </div>
                    <button onClick={() => handleGenerateReport(false)} disabled={loading} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300">
                        {loading ? 'Membuat...' : 'Buat Laporan'}
                    </button>
                </div>
            </div>

            {/* Report Display Section */}
            {reportData && (
                <div className="p-6 bg-white rounded-lg shadow-md">
                    {/* Header Laporan (Diperbarui) */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                        <div>
                            <h2 className="text-xl font-bold">{reportData.title}</h2>
                            <p className="text-sm text-gray-600">{reportData.meta.lokasi} | {reportData.meta.periode}</p>
                            <p className="text-xs text-gray-400 mt-1">Dibuat pada: {reportData.meta.dibuatPada}</p>
                        </div>
                        <button onClick={() => handleGenerateReport(true)} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300 w-full md:w-auto">
                            Ekspor ke Excel
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs table-auto">
                            <thead className="bg-gray-100">
                                <tr>
                                    {reportData.headers.map(h => <th key={h} className="p-2 border whitespace-nowrap">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                            {reportData.rows.map((row, index) => (
                                <tr key={index} className="border-b">
                                    {reportData.headers.map(header => (
                                        <td key={header} className={`p-2 border text-center ${header === 'Nama Pekerja' ? 'text-left font-medium' : ''}`}>
                                            {typeof row[header] === 'number' && header.includes('(Rp)') ? `Rp ${row[header].toLocaleString('id-ID')}` : row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                            <tfoot className="font-bold bg-gray-50">
                            {/* --- FOOTER UNTUK LAPORAN KEHADIRAN (DIPERBARUI) --- */}
                            {filters.reportType === 'kehadiran' && reportData.dailyTotals && (
                                <>
                                    <tr>
                                        {reportData.headers.map(header => (
                                            <td key={header} className="p-2 border text-center">
                                                {reportData.dailyTotals[header] || ''}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-2 border text-right" colSpan={reportData.headers.length - 3}>GRAND TOTAL</td>
                                        <td className="p-2 border text-center">{reportData.grandTotals.hadir}</td>
                                        <td className="p-2 border text-center">{reportData.grandTotals.absen}</td>
                                        <td className="p-2 border text-center">{reportData.grandTotals.izin}</td>
                                    </tr>
                                </>
                            )}
                            {/* --- FOOTER UNTUK LAPORAN GAJI --- */}
                            {filters.reportType === 'gaji' && reportData.totals && (
                                <tr>
                                    <td colSpan="3" className="p-2 border text-right">GRAND TOTAL</td>
                                    <td className="p-2 border text-center">Rp {reportData.totals.gajiPokok.toLocaleString('id-ID')}</td>
                                    <td className="p-2 border text-center">Rp {reportData.totals.gajiLembur.toLocaleString('id-ID')}</td>
                                    <td className="p-2 border text-center">Rp {reportData.totals.totalGaji.toLocaleString('id-ID')}</td>
                                </tr>
                            )}
                            </tfoot>
                        </table>
                    </div>
                    {/* --- BAGIAN BARU: Tampilkan Legenda untuk Laporan Kehadiran --- */}
                    {filters.reportType === 'kehadiran' && (
                        <div className="mt-4 text-xs text-gray-600 space-y-1">
                            <h4 className="font-bold">Legenda:</h4>
                            <p>
                                <span className="font-bold">H</span>: Hadir, <span className="font-bold">T</span>: Telat, <span className="font-bold">A</span>: Absen, <span className="font-bold">I</span>: Izin, <span className="font-bold">L</span>: Lembur, <span className="font-bold">P</span>: Pulang Cepat
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default LaporanProyek;