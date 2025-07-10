import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Layout from '../components/Layout';

const PengajuanIzin = () => {
    const [formData, setFormData] = useState({
        jenis_izin: 'Sakit',
        tanggal_mulai: '',
        tanggal_selesai: '',
        keterangan: ''
    });
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            setError('Ukuran file tidak boleh lebih dari 5MB.');
            setFile(null);
        } else {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // Validasi tanggal
        const startDate = new Date(formData.tanggal_mulai);
        const endDate = new Date(formData.tanggal_selesai);

        if (startDate > endDate) {
            setError('Tanggal selesai harus setelah tanggal mulai.');
            return;
        }

        // Siapkan FormData untuk dikirim
        const data = new FormData();
        data.append('jenis_izin', formData.jenis_izin);
        data.append('tanggal_mulai', formData.tanggal_mulai);
        data.append('tanggal_selesai', formData.tanggal_selesai);
        data.append('keterangan', formData.keterangan);

        if (file) {
            data.append('bukti', file); // Pastikan nama field sesuai multer di backend
        }

        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/izin', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage('Pengajuan izin berhasil dikirim.');
            setFormData({
                jenis_izin: 'Sakit',
                tanggal_mulai: '',
                tanggal_selesai: '',
                keterangan: ''
            });
            setFile(null);
        } catch (err) {
            console.error("Error saat mengirim izin:", err);
            setError(err.response?.data?.message || 'Terjadi kesalahan saat mengirim pengajuan.');
        }
    };

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Buat Pengajuan Izin</h1>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
                    {/* Jenis Izin */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Jenis Izin</label>
                        <select
                            name="jenis_izin"
                            value={formData.jenis_izin}
                            onChange={handleChange}
                            className="mt-1 p-2 cursor-pointer block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option>Sakit</option>
                            <option>Cuti</option>
                            <option>Izin Penting</option>
                        </select>
                    </div>

                    {/* Rentang Tanggal */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Rentang Tanggal</label>
                        <div className="flex gap-4">
                            <input
                                type="date"
                                name="tanggal_mulai"
                                value={formData.tanggal_mulai}
                                onChange={handleChange}
                                required
                                className="mt-1 p-2 cursor-pointer block w-full border-gray-300 rounded-md shadow-sm"
                            />
                            <input
                                type="date"
                                name="tanggal_selesai"
                                value={formData.tanggal_selesai}
                                onChange={handleChange}
                                required
                                className="mt-1 p-2 cursor-pointer block w-full border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Keterangan</label>
                        <textarea
                            name="keterangan"
                            value={formData.keterangan}
                            onChange={handleChange}
                            rows="4"
                            required
                            className="mt-1 p-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        ></textarea>
                    </div>

                    {/* Lampiran Bukti */}
                    <div className={'cursor-pointer'}>
                        <label className="block text-sm font-medium mb-1">Lampiran Bukti (Opsional)</label>
                        <input
                            type="file"
                            name="bukti"
                            onChange={handleFileChange}
                            className="mt-1 cursor-pointer block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    {/* Pesan feedback */}
                    {message && <p className="text-green-600">{message}</p>}
                    {error && <p className="text-red-600">{error}</p>}

                    {/* Tombol Submit */}
                    <button
                        type="submit"
                        className="w-full cursor-pointer bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
                    >
                        Kirim Pengajuan
                    </button>
                </form>
            </div>
        </Layout>
    );
};

export default PengajuanIzin;