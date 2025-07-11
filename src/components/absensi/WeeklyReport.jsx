// components/absensi/WeeklyReport.jsx
import { getStatusBadge } from '../../utils/statusUtils';

const WeeklyReport = ({ absensiMingguan, reportLoading, selectedDate, setSelectedDate }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-xl font-semibold">Laporan Absensi Mingguan</h2>
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                    <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Pekerja di lokasi Anda
                    </span>
                </div>
            </div>
            <div className="mb-6 flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <label htmlFor="week-picker" className="font-medium text-gray-700">Pilih Tanggal:</label>
                <input 
                    type="date" 
                    id="week-picker" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="border-gray-300 rounded-md shadow-sm"
                />
            </div>
            {reportLoading ? (
                <p className="text-center p-4">Memuat laporan...</p>
            ) : absensiMingguan.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 mb-2">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Tidak Ada Data Absensi</h3>
                    <p className="text-gray-500">
                        Belum ada data absensi untuk minggu yang dipilih atau tidak ada pekerja yang ditugaskan di lokasi Anda.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left table-auto text-sm">
                        <thead className="border-b-2 bg-gray-50">
                            <tr>
                                <th className="p-3 font-semibold">Nama Pekerja</th>
                                <th className="p-3 font-semibold hidden lg:table-cell">Jabatan</th>
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(h => 
                                    <th key={h} className="p-3 font-semibold text-center">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {absensiMingguan.map((pekerja) => (
                                <tr key={pekerja.id_pekerja} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium text-gray-800">{pekerja.nama_pengguna}</td>
                                    <td className="p-3 text-gray-600 hidden lg:table-cell">{pekerja.nama_pekerjaan}</td>
                                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hari => (
                                        <td key={hari} className="p-3 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pekerja[hari])}`}>
                                                {pekerja[hari]}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WeeklyReport;
