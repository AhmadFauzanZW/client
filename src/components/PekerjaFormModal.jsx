// src/components/PekerjaFormModal.jsx

import { useState, useEffect } from 'react';

const PekerjaFormModal = ({ isOpen, onClose, onSubmit, initialData, metaData }) => {
    const [formData, setFormData] = useState({
        nama_pengguna: '', email: '', password: '',
        id_jenis_pekerjaan: '', id_lokasi_penugasan: '', gaji_harian: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, password: '' }); // Kosongkan password saat edit
        } else {
            setFormData({
                nama_pengguna: '', email: '', password: '',
                id_jenis_pekerjaan: '', id_lokasi_penugasan: '', gaji_harian: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-100 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Data Pekerja' : 'Tambah Pekerja Baru'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="nama_pengguna" value={formData.nama_pengguna} onChange={handleChange} placeholder="Nama Lengkap" required className="w-full p-2 border rounded" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full p-2 border rounded" />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={initialData ? 'Kosongkan jika tidak ganti password' : 'Password'} required={!initialData} className="w-full p-2 border rounded" />
                    <select name="id_jenis_pekerjaan" value={formData.id_jenis_pekerjaan} onChange={handleChange} required className="w-full p-2 border rounded">
                        <option value="">Pilih Jabatan</option>
                        {metaData?.jabatan.map(j => <option key={j.id_jenis_pekerjaan} value={j.id_jenis_pekerjaan}>{j.nama_pekerjaan}</option>)}
                    </select>
                    <select name="id_lokasi_penugasan" value={formData.id_lokasi_penugasan} onChange={handleChange} required className="w-full p-2 border rounded">
                        <option value="">Pilih Lokasi Proyek</option>
                        {metaData?.lokasi.map(l => <option key={l.id_lokasi} value={l.id_lokasi}>{l.nama_lokasi}</option>)}
                    </select>
                    <input type="number" name="gaji_harian" value={formData.gaji_harian} onChange={handleChange} placeholder="Gaji Harian (Rp)" required className="w-full p-2 border rounded" />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PekerjaFormModal;