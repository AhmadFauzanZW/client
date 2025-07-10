// src/pages/HalamanAbsensi.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import axiosInstance from '../api/axiosInstance';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam'; // Diimpor dari versi sebelumnya

// Helper dari kode lama untuk styling badge status
const getStatusBadge = (status) => {
  switch (status) {
    case 'Hadir': return 'bg-green-100 text-green-800';
    case 'Telat': return 'bg-yellow-100 text-yellow-800';
    case 'Izin': return 'bg-cyan-100 text-cyan-800';
    case 'Lembur': return 'bg-indigo-100 text-indigo-800';
    case 'Pulang Cepat': return 'bg-orange-100 text-orange-800';
    case 'Absen': return 'bg-red-100 text-red-800';
    case 'N/A': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const HalamanAbsensi = () => {
  // === STATE GABUNGAN DARI SEMUA VERSI ===

  // State untuk Inisialisasi & UI Umum
  const [systemSetupLoading, setSystemSetupLoading] = useState(true);
  const [systemSetupMessage, setSystemSetupMessage] = useState('Mempersiapkan sistem...');
  const [isProcessing, setIsProcessing] = useState(false);

  // State untuk Data Pekerja & Laporan
  const [pekerjaList, setPekerjaList] = useState([]);
  const [pekerjaBelumAbsen, setPekerjaBelumAbsen] = useState([]);
  const [absensiMingguan, setAbsensiMingguan] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  // State untuk Sesi Absensi Semi-Otomatis (face-api.js)
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedPekerjaId, setSelectedPekerjaId] = useState('');

  // State untuk Pencatatan Manual (react-webcam)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedPekerjaManual, setSelectedPekerjaManual] = useState(null);
  const [aksiManual, setAksiManual] = useState(''); // 'clock_in' atau 'clock_out'

  // Refs
  const videoRef = useRef(); // Untuk face-api
  const webcamRef = useRef(); // Untuk react-webcam manual
  const intervalRef = useRef();

  // === FUNGSI-FUNGSI ===

  // 1. Inisialisasi Sistem & Pengambilan Data
  const fetchAbsensiMingguan = useCallback(async (tanggal) => {
    setReportLoading(true);
    try {
      const { data } = await axiosInstance.get('/kehadiran/mingguan', { params: { tanggal } });
      setAbsensiMingguan(data);
    } catch (error) {
      console.error("Gagal mengambil data absensi mingguan:", error);
    } finally {
      setReportLoading(false);
    }
  }, []);

  const setupSystem = useCallback(async () => {
    setSystemSetupLoading(true);
    try {
      setSystemSetupMessage('Memuat model deteksi wajah...');
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');

      setSystemSetupMessage('Mengambil daftar pekerja...');
      const { data } = await axiosInstance.get('/pekerja/all');
      setPekerjaList(data);
      setPekerjaBelumAbsen(data); // Asumsi awal, semua belum absen
      if (data.length > 0) {
        setSelectedPekerjaId(data[0].id_pekerja);
      }

      setSystemSetupMessage('Mengambil laporan mingguan...');
      await fetchAbsensiMingguan(new Date().toISOString().slice(0, 10));

    } catch (error) {
      setSystemSetupMessage('Gagal mempersiapkan sistem. Coba refresh halaman.');
      console.error("Inisialisasi gagal:", error);
    } finally {
      setSystemSetupLoading(false);
    }
  }, [fetchAbsensiMingguan]);

  useEffect(() => {
    setupSystem();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, [setupSystem]);

  useEffect(() => {
    fetchAbsensiMingguan(selectedDate);
  }, [selectedDate, fetchAbsensiMingguan]);

  // 2. Handler untuk Sesi Semi-Otomatis
  const startSession = () => {
    setIsSessionActive(true);
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(err => console.error("Error webcam:", err));
  };

  const stopSession = () => {
    setIsSessionActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && !capturedImage) {
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }));
        if (detection) {
          clearInterval(intervalRef.current);
          const videoEl = videoRef.current;
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          setCapturedImage(canvas.toDataURL('image/jpeg'));
        }
      }
    }, 800);
  };

  const handleConfirmAbsenOtomatis = async () => {
    if (!selectedPekerjaId) return alert('Silakan pilih nama pekerja.');
    setIsProcessing(true);
    try {
      const response = await axiosInstance.post('/kehadiran/catat', {
        id_pekerja: selectedPekerjaId,
        tipe_aksi: 'clock_in',
        metode: 'Wajah',
        fotoB64: capturedImage,
        id_lokasi: 1
      });
      alert(response.data.message);
      const updatedList = pekerjaBelumAbsen.filter(p => p.id_pekerja !== parseInt(selectedPekerjaId));
      setPekerjaBelumAbsen(updatedList);
      if (updatedList.length > 0) setSelectedPekerjaId(updatedList[0].id_pekerja);
      setCapturedImage(null);
      handleVideoPlay(); // Lanjutkan deteksi
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan absensi.');
    } finally {
      setIsProcessing(false);
      fetchAbsensiMingguan(selectedDate); // REFRESH LAPORAN
    }
  };

  // 3. Handler untuk Pencatatan Manual
  const openManualCamera = (pekerja, tipeAksi) => {
    setSelectedPekerjaManual(pekerja);
    setAksiManual(tipeAksi);
    setIsManualModalOpen(true);
  };

  const handleManualCaptureAndPost = async () => {
    setIsProcessing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert('Gagal mengambil gambar.');
      return setIsProcessing(false);
    }
    try {
      const response = await axiosInstance.post('/kehadiran/catat', {
        id_pekerja: selectedPekerjaManual.id_pekerja,
        tipe_aksi: aksiManual,
        metode: 'Wajah (Manual)',
        fotoB64: imageSrc,
        id_lokasi: 1
      });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal menyimpan absensi.');
    } finally {
      setIsProcessing(false);
      setIsManualModalOpen(false);
      fetchAbsensiMingguan(selectedDate); // REFRESH LAPORAN
    }
  };

  // === RENDER KOMPONEN ===

  if (systemSetupLoading) return <Layout><p className="p-10 text-center text-lg font-semibold animate-pulse">{systemSetupMessage}</p></Layout>;

  return (
      <Layout>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Halaman Absensi</h1>

        {/* Bagian 1: Sesi Absensi Semi-Otomatis */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-2">Sesi Absensi Semi-Otomatis</h2>
          {!isSessionActive ? (
              <div className="text-center py-4">
                <button onClick={startSession} className="bg-teal-600 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-teal-700 transition-colors">
                  Mulai Sesi Absensi Wajah
                </button>
              </div>
          ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">Arahkan wajah ke kamera. Sistem akan mengambil gambar secara otomatis.</p>
                <div className="relative w-full max-w-lg mx-auto h-80 bg-gray-900 rounded-lg overflow-hidden border-4 border-gray-300">
                  <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} style={{ transform: 'scaleX(-1)', width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button onClick={stopSession} className="mt-6 bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">
                  Hentikan Sesi
                </button>
              </div>
          )}
        </div>

        {/* Bagian 2: Pencatatan Manual */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Pencatatan Kehadiran Manual</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead className="border-b-2 bg-gray-50">
              <tr>
                <th className="p-3 font-semibold text-sm">Nama Pekerja</th>
                <th className="p-3 font-semibold text-sm">Jabatan</th>
                <th className="p-3 font-semibold text-sm">Aksi</th>
              </tr>
              </thead>
              <tbody>
              {pekerjaList.map((pekerja) => (
                  <tr key={pekerja.id_pekerja} className="border-b">
                    <td className="p-3 font-medium">{pekerja.nama_pengguna}</td>
                    <td className="p-3 text-gray-600">{pekerja.nama_pekerjaan}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openManualCamera(pekerja, 'clock_in')} className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600">Clock-In</button>
                        <button onClick={() => openManualCamera(pekerja, 'clock_out')} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">Clock-Out</button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bagian 3: Laporan Mingguan */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Laporan Absensi Mingguan</h2>
          <div className="mb-6 flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <label htmlFor="week-picker" className="font-medium text-gray-700">Pilih Tanggal:</label>
            <input type="date" id="week-picker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-gray-300 rounded-md shadow-sm"/>
          </div>
          {reportLoading ? <p>Memuat laporan...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead className="border-b-2 bg-gray-50">
                  <tr>
                    <th className="p-3 font-semibold text-sm">Nama Pekerja</th>
                    <th className="p-3 font-semibold text-sm hidden lg:table-cell">Jabatan</th>
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(h => <th key={h} className="p-3 font-semibold text-sm text-center">{h}</th>)}
                  </tr>
                  </thead>
                  <tbody>
                  {absensiMingguan.map((pekerja) => (
                      <tr key={pekerja.id_pekerja} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-800">{pekerja.nama_lengkap}</td>
                        <td className="p-3 text-gray-600 hidden lg:table-cell">{pekerja.nama_pekerjaan}</td>
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hari => (
                            <td key={hari} className="p-3 text-center">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(pekerja[hari])}`}>{pekerja[hari]}</span>
                            </td>
                        ))}
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* === MODAL-MODAL === */}

        {/* Modal 1: Konfirmasi Absen Semi-Otomatis */}
        {capturedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">Konfirmasi Absensi</h2>
                <img src={capturedImage} alt="Bukti Absen" className="w-full rounded-lg mb-4 border" style={{ transform: 'scaleX(-1)' }}/>
                <div className="space-y-2">
                  <label htmlFor="pekerja-select" className="block text-sm font-medium text-gray-700">Pilih Pekerja:</label>
                  <select id="pekerja-select" value={selectedPekerjaId} onChange={(e) => setSelectedPekerjaId(e.target.value)} className="block w-full p-2 border-gray-300 rounded-md shadow-sm">
                    {pekerjaBelumAbsen.map(p => <option key={p.id_pekerja} value={p.id_pekerja}>{p.nama_pengguna}</option>)}
                  </select>
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <button onClick={handleConfirmAbsenOtomatis} disabled={isProcessing} className="bg-green-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-green-700 disabled:opacity-50">
                    {isProcessing ? 'Memproses...' : 'Konfirmasi Clock-In'}
                  </button>
                  <button onClick={() => { setCapturedImage(null); handleVideoPlay(); }} disabled={isProcessing} className="bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 disabled:opacity-50">
                    Ambil Ulang / Lanjutkan Deteksi
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Modal 2: Pencatatan Manual */}
        {isManualModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-md mx-4">
                <h2 className="text-2xl font-bold mb-2">Ambil Foto Bukti</h2>
                <p className="text-xl font-semibold mb-4 text-blue-600">{selectedPekerjaManual?.nama_pengguna}</p>
                <div className="w-full h-64 mx-auto border-4 rounded-lg overflow-hidden bg-gray-900 mb-6">
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} videoConstraints={{ facingMode: "user" }} />
                </div>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setIsManualModalOpen(false)} disabled={isProcessing} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">Batal</button>
                  <button onClick={handleManualCaptureAndPost} disabled={isProcessing} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {isProcessing ? 'Memproses...' : `Ambil Foto & ${aksiManual === 'clock_in' ? 'Clock-In' : 'Clock-Out'}`}
                  </button>
                </div>
              </div>
            </div>
        )}
      </Layout>
  );
};

export default HalamanAbsensi;