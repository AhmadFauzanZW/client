// components/absensi/DailyStatusTable.jsx
import { useState, useEffect } from 'react';
import { getStatusBadge } from '../../utils/statusUtils';

const DailyStatusTable = ({ workerStatusList, isLoading, onOpenModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredList, setFilteredList] = useState([]);

    useEffect(() => {
        const result = workerStatusList.filter(w =>
            w.nama_pengguna.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.log('Worker status list:', workerStatusList);
        console.log('Search term:', searchTerm);
        console.log('Filtered result:', result);
        setFilteredList(result);
    }, [searchTerm, workerStatusList]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold text-gray-700">Status Pekerja Hari Ini</h2>
                <input
                    type="text"
                    placeholder="Cari nama pekerja..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full sm:w-64"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b-2 bg-gray-50">
                        <tr>
                            <th className="p-3 font-semibold">Nama Pekerja</th>
                            <th className="p-3 font-semibold text-center">Status</th>
                            <th className="p-3 font-semibold text-center">Clock-In</th>
                            <th className="p-3 font-semibold text-center">Clock-Out</th>
                            <th className="p-3 font-semibold text-center">Aksi Manual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">Memuat data pekerja...</td></tr>
                        ) : workerStatusList.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">Tidak ada data pekerja yang ditemukan dari server.</td></tr>
                        ) : filteredList.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">Tidak ada pekerja yang cocok dengan pencarian "{searchTerm}".</td></tr>
                        ) : (
                            filteredList.map(worker => {
                                const clockedIn = !!worker.waktu_clock_in;
                                const clockedOut = !!worker.waktu_clock_out;
                                
                                let statusText = "Belum Hadir";
                                if (clockedIn && !clockedOut) statusText = `${worker.status_kehadiran}`;
                                if (clockedOut) statusText = `Pulang (${worker.status_kehadiran})`;

                                return (
                                    <tr key={worker.id_pekerja} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{worker.nama_pengguna}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(statusText)}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-gray-600">
                                            {clockedIn ? new Date(worker.waktu_clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="p-3 text-center text-gray-600">
                                            {clockedOut ? new Date(worker.waktu_clock_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                {!clockedIn && (
                                                    <button 
                                                        onClick={() => onOpenModal('manual', worker, 'clock_in')} 
                                                        className="text-green-600 hover:text-green-800 font-semibold"
                                                    >
                                                        Clock-In
                                                    </button>
                                                )}
                                                {clockedIn && !clockedOut && (
                                                    <button 
                                                        onClick={() => onOpenModal('manual', worker, 'clock_out')} 
                                                        className="text-red-600 hover:text-red-800 font-semibold"
                                                    >
                                                        Clock-Out
                                                    </button>
                                                )}
                                                {clockedOut && ( <span className="text-gray-400">-</span> )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DailyStatusTable;
