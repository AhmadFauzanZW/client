import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Layout from '../components/Layout';

const ValidasiIzin = () => {
  const [izinList, setIzinList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk menghitung durasi izin
  const hitungDurasi = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Termasuk hari awal
  };

  // Ambil data pengajuan izin dari API
  const fetchIzinUntukValidasi = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('/izin/validasi', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIzinList(response.data);
    } catch (error) {
      console.error("Gagal mengambil data izin:", error);
    } finally {
      setLoading(false);
    }
  };

  // Kirim aksi ke API
  const handleAction = async (id_pengajuan, aksi) => {
    let catatan = '';

    if (aksi === 'tolak') {
      // Jika menolak, wajib mengisi alasan. Loop sampai diisi.
      let alasan = '';
      do {
        alasan = window.prompt('Mohon masukkan alasan penolakan:');
        if (alasan === null) return; // User menekan tombol "Cancel", batalkan aksi
      } while (!alasan.trim()); // Terus bertanya jika alasan kosong atau hanya spasi
      catatan = alasan;
    } else { // Jika menyetujui
      // Tampilkan prompt dengan nilai default, bersifat opsional
      const catatanOpsional = window.prompt('Tambahkan catatan (opsional):', 'Disetujui');
      if (catatanOpsional === null) return; // User menekan tombol "Cancel", batalkan aksi
      catatan = catatanOpsional;
    }

    // Lanjutkan kirim data ke API
    try {
      setLoading(true); // Opsional: tampilkan loading saat proses
      const token = localStorage.getItem('token');
      await axiosInstance.put(
          `/izin/${id_pengajuan}/proses`,
          { aksi, catatan }, // <-- KIRIM 'catatan' DI SINI
          { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh list setelah berhasil update
      fetchIzinUntukValidasi();
    } catch (error) {
      console.error(`Gagal memproses izin (${aksi}):`, error);
      alert(`Gagal memproses izin. ${error.response?.data?.message || 'Silakan coba lagi.'}`);
    } finally {
      setLoading(false); // Opsional
    }
  };

  // Fetch data saat komponen mount
  useEffect(() => {
    fetchIzinUntukValidasi();
  }, []);

  if (loading) {
    return (
        <Layout>
          <p className="text-center py-4">Memuat pengajuan izin...</p>
        </Layout>
    );
  }

  return (
      <Layout>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Validasi Pengajuan Izin</h1>

        <div className="space-y-4">
          {izinList.length > 0 ? (
              izinList.map((izin) => (
                  <div key={izin.id_pengajuan} className="bg-white p-5 rounded-lg shadow-md flex flex-col md:flex-row gap-4">
                    {/* Kolom Informasi Utama */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg text-gray-800">{izin.nama_pengguna}</p>
                          <p className="text-sm text-gray-500">Jenis Izin: {izin.jenis_izin}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {new Date(izin.tanggal_mulai).toLocaleDateString('id-ID')} → {new Date(izin.tanggal_selesai).toLocaleDateString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-500">
                            Durasi: {hitungDurasi(izin.tanggal_mulai, izin.tanggal_selesai)} hari
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-gray-700 text-sm">Alasan: {izin.keterangan}</p>

                      {/* Lampiran (jika ada) */}
                      {izin.file_bukti_path && (
                          <div className="mt-4">
                            <a
                                href={`http://localhost:5000/uploads/${izin.file_bukti_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full md:w-auto text-center bg-gray-200 text-gray-700 px-3 py-2 text-sm rounded hover:bg-gray-300 transition"
                            >
                              Lihat Lampiran
                            </a>
                          </div>
                      )}
                    </div>

                    {/* Kolom Aksi */}
                    <div className="flex-shrink-0 flex flex-col md:items-end justify-center gap-3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                      <div className="w-full flex md:justify-end gap-2">
                        <button
                            onClick={() => handleAction(izin.id_pengajuan, 'tolak')}
                            className="w-1/2 md:w-full bg-red-100 text-red-700 px-3 py-2 text-sm rounded hover:bg-red-200 transition"
                        >
                          Tolak
                        </button>
                        <button
                            onClick={() => handleAction(izin.id_pengajuan, 'setuju')}
                            className="w-1/2 md:w-full bg-green-100 text-green-700 px-3 py-2 text-sm rounded hover:bg-green-200 transition"
                        >
                          Setujui
                        </button>
                      </div>
                    </div>
                  </div>
              ))
          ) : (
              <p className="text-lg text-gray-800">Tidak ada pengajuan izin yang menunggu validasi Anda saat ini.</p>
          )}
        </div>
      </Layout>
  );
};

export default ValidasiIzin;