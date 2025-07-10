// src/pages/HalamanAbsensi.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import axiosInstance from '../api/axiosInstance';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { QrReader } from 'react-qr-reader';

// Custom QR Scanner Component with visible camera
const CustomQrReader = ({ onResult, style }) => {
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);
    const [lastScan, setLastScan] = useState('');
    
    const handleResult = (result, error) => {
        if (result) {
            const scannedText = result.text;
            console.log('QR Scanned:', scannedText);
            
            // Prevent duplicate scans within 2 seconds
            if (scannedText !== lastScan) {
                setLastScan(scannedText);
                onResult(result);
                
                // Reset after 2 seconds to allow re-scanning
                setTimeout(() => setLastScan(''), 2000);
            }
        }
        
        // Perbaikan error handling yang lebih robust
        if (error) {
            try {
                // Pastikan error memiliki struktur yang benar
                const errorMessage = error?.message || error?.toString() || 'Unknown error';
                
                // Hanya log error yang bukan "No QR code found"
                if (typeof errorMessage === 'string' && !errorMessage.toLowerCase().includes('no qr code found')) {
                    console.warn('QR Scan Error:', errorMessage);
                    setError(errorMessage);
                    
                    // Clear error setelah 3 detik
                    setTimeout(() => setError(null), 3000);
                }
            } catch (e) {
                console.warn('Error processing QR scan error:', e);
            }
        }
    };
    
    return (
        <div style={style} className="relative">
            {isScanning && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-10">
                    Scanning...
                </div>
            )}
            {error && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs z-10">
                    Error: {error}
                </div>
            )}
            <QrReader
                onResult={handleResult}
                constraints={{ 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }}
                style={{ width: '100%', height: '100%' }}
                videoStyle={{ 
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%'
                }}
                containerStyle={{ 
                    width: '100%', 
                    height: '100%',
                    position: 'relative'
                }}
                scanDelay={500}
                videoId="qr-video"
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-blue-400 rounded-lg animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-red-400 rounded-lg"></div>
            </div>
        </div>
    );
};

// Helper untuk styling badge status (diambil dari kode Anda)
const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-100 text-gray-500';
    switch (status) {
        case 'Hadir': return 'bg-green-100 text-green-800';
        case 'Telat': return 'bg-yellow-100 text-yellow-800';
        case 'Izin': return 'bg-cyan-100 text-cyan-800';
        case 'Lembur': return 'bg-indigo-100 text-indigo-800';
        case 'Pulang Cepat': return 'bg-orange-100 text-orange-800';
        case 'Absen': return 'bg-red-100 text-red-800';
        case 'N/A': return 'bg-gray-100 text-gray-500';
        default:
            if (status.includes('Hadir')) return 'bg-green-100 text-green-800';
            if (status.includes('Telat')) return 'bg-yellow-100 text-yellow-800';
            if (status.includes('Pulang')) return 'bg-indigo-100 text-indigo-800';
            if (status.includes('Belum Hadir')) return 'bg-red-100 text-red-800';
            return 'bg-gray-100 text-gray-800';
    }
};

// =================================================================================
// KOMPONEN MODAL TERPUSAT UNTUK SEMUA AKSI ABSENSI
// =================================================================================
const AttendanceModal = ({ isOpen, onClose, onComplete, mode, worker, actionType }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [allWorkers, setAllWorkers] = useState([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const [selectedWorkerStatus, setSelectedWorkerStatus] = useState(null);
    const [detectedAction, setDetectedAction] = useState('clock_in');
    const videoRef = useRef();
    const webcamRef = useRef();
    const intervalRef = useRef();

    useEffect(() => {
        if (mode === 'face' && isOpen) {
            // Fetch all workers with their current status
            axiosInstance.get('/kehadiran/status-harian')
                .then(response => {
                    setAllWorkers(response.data);
                    if (response.data.length > 0) {
                        setSelectedWorkerId(response.data[0].id_pekerja);
                        setSelectedWorkerStatus(response.data[0]);
                        // Determine action based on worker status
                        const hasClockIn = !!response.data[0].waktu_clock_in;
                        const hasClockOut = !!response.data[0].waktu_clock_out;
                        setDetectedAction(hasClockIn && !hasClockOut ? 'clock_out' : 'clock_in');
                    }
                })
                .catch(err => setError('Gagal memuat daftar pekerja.'));
        }
    }, [mode, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
            setError('');
            setCapturedImage(null);
            setSelectedWorkerStatus(null);
            setDetectedAction('clock_in');
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        }
    }, [isOpen]);

    const handleSubmit = async (payloadData) => {
        setIsProcessing(true);
        setError('');
        try {
            let endpoint = '/kehadiran/catat';
            let payload = payloadData;
            
            // Use different endpoints based on method
            if (payloadData.metode === 'QR') {
                endpoint = '/kehadiran/catat-by-qr';
                // Format payload sesuai dengan yang diharapkan backend
                payload = {
                    qrCode: payloadData.qrCode,
                    tipeAksi: payloadData.tipeAksi || 'auto',
                    idLokasi: payloadData.idLokasi || 1
                };
            }
            
            console.log('Submitting to endpoint:', endpoint);
            console.log('Payload:', payload);
            
            const { data } = await axiosInstance.post(endpoint, payload);
            alert(data.message || 'Aksi berhasil dicatat!');
            onComplete();
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan saat mencatat absensi.';
            console.error('Submit error:', err);
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVideoPlay = useCallback(() => {
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
    }, [capturedImage]);

    useEffect(() => {
        if (mode === 'face' && isOpen && !capturedImage) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
                .catch(err => setError("Tidak bisa mengakses kamera."));
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); }
    }, [mode, isOpen, capturedImage]);

    const confirmFaceAttendance = () => {
        if (!selectedWorkerId || !capturedImage) return;
        handleSubmit({
            id_pekerja: selectedWorkerId,
            tipe_aksi: detectedAction,
            metode: 'Wajah',
            fotoB64: capturedImage,
            id_lokasi: 1,
        });
    };

    const captureAndSubmitManual = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError('Gagal mengambil gambar. Coba lagi.');
            return;
        }
        handleSubmit({
            id_pekerja: worker.id_pekerja,
            tipe_aksi: actionType,
            metode: 'Wajah (Manual)',
            fotoB64: imageSrc,
            id_lokasi: 1,
        });
    };

    const handleQrScan = (result) => {
        if (result && !isProcessing) {
            const scannedCode = result.text;
            console.log('QR Code Scanned:', scannedCode);
            
            // Validate QR Code format (should start with EMP_)
            if (!scannedCode.startsWith('EMP_')) {
                setError('QR Code tidak valid. Format harus dimulai dengan EMP_');
                alert('QR Code tidak valid untuk sistem absensi ini.');
                return;
            }
            
            // Extract worker ID from QR code (EMP_001_randomstring -> 001)
            const qrParts = scannedCode.split('_');
            if (qrParts.length < 3) {
                setError('Format QR Code tidak valid');
                alert('Format QR Code tidak sesuai dengan sistem.');
                return;
            }
            
            console.log('QR Code valid, submitting to backend...');
            
            // Submit dengan format yang sesuai dengan backend
            handleSubmit({
                qrCode: scannedCode,
                tipeAksi: 'auto', // Backend akan menentukan
                metode: 'QR',
                idLokasi: 1,
            });
        }
    };
    
    if (!isOpen) return null;

    // Function to handle worker selection and update action type
    const handleWorkerSelection = (workerId) => {
        setSelectedWorkerId(workerId);
        const worker = allWorkers.find(w => w.id_pekerja === workerId);
        setSelectedWorkerStatus(worker);
        
        if (worker) {
            const hasClockIn = !!worker.waktu_clock_in;
            const hasClockOut = !!worker.waktu_clock_out;
            setDetectedAction(hasClockIn && !hasClockOut ? 'clock_out' : 'clock_in');
        }
    };

    // ... (Konten render modal tetap sama seperti sebelumnya, tidak perlu diubah)
    const renderContent = () => {
        switch (mode) {
            case 'face':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center">Sesi Absensi Wajah</h2>
                        {!capturedImage ? (
                            <>
                                <p className="text-sm text-gray-500 mb-4 text-center">Arahkan wajah ke kamera. Sistem akan mengambil gambar secara otomatis.</p>
                                <div className="relative w-full max-w-lg mx-auto h-72 bg-gray-900 rounded-lg overflow-hidden border-4 border-gray-300">
                                    <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} style={{ transform: 'scaleX(-1)', width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </>
                        ) : (
                            <>
                                <img src={capturedImage} alt="Bukti Absen" className="w-full rounded-lg mb-4 border" style={{ transform: 'scaleX(-1)' }}/>
                                <div className="space-y-2">
                                    <label htmlFor="pekerja-select" className="block text-sm font-medium text-gray-700">Pilih Pekerja:</label>
                                    <select id="pekerja-select" value={selectedWorkerId} onChange={(e) => handleWorkerSelection(e.target.value)} className="block w-full p-2 border-gray-300 rounded-md shadow-sm">
                                        {allWorkers.map(p => <option key={p.id_pekerja} value={p.id_pekerja}>{p.nama_pengguna}</option>)}
                                    </select>
                                    {selectedWorkerStatus && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                            <p><strong>Status saat ini:</strong></p>
                                            <p>Clock-In: {selectedWorkerStatus.waktu_clock_in ? new Date(selectedWorkerStatus.waktu_clock_in).toLocaleTimeString('id-ID') : 'Belum'}</p>
                                            <p>Clock-Out: {selectedWorkerStatus.waktu_clock_out ? new Date(selectedWorkerStatus.waktu_clock_out).toLocaleTimeString('id-ID') : 'Belum'}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    <button onClick={confirmFaceAttendance} disabled={isProcessing} className={`text-white font-bold py-3 rounded-lg text-lg disabled:opacity-50 ${detectedAction === 'clock_in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                        {isProcessing ? 'Memproses...' : `Konfirmasi ${detectedAction === 'clock_in' ? 'Clock-In' : 'Clock-Out'}`}
                                    </button>
                                    <button onClick={() => setCapturedImage(null)} disabled={isProcessing} className="bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 disabled:opacity-50">
                                        Ambil Ulang
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'qr':
                 return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center">Pindai QR Code Pekerja</h2>
                        <p className="text-center text-gray-600 mb-4">Sistem akan otomatis mendeteksi apakah untuk Clock In atau Clock Out</p>
                        <div className="w-full h-80 mx-auto border-4 rounded-lg overflow-hidden bg-gray-900 mb-6 relative">
                           <CustomQrReader
                                onResult={handleQrScan}
                                style={{ width: '100%', height: '100%' }}
                           />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600 mb-2">Arahkan kamera ke QR Code milik pekerja</p>
                            <p className="text-sm text-blue-600">
                                📱 Pastikan QR Code berada dalam kotak merah di tengah
                            </p>
                            {isProcessing && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p className="text-blue-700">Memproses absensi...</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'manual':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Ambil Foto Bukti</h2>
                        <p className="text-xl font-semibold mb-4 text-blue-600">{worker?.nama_pengguna}</p>
                        <div className="w-full h-64 mx-auto border-4 rounded-lg overflow-hidden bg-gray-900 mb-6">
                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} videoConstraints={{ facingMode: "user" }} />
                        </div>
                        <button onClick={captureAndSubmitManual} disabled={isProcessing} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-lg hover:bg-blue-700 disabled:opacity-50">
                            {isProcessing ? 'Memproses...' : `Ambil Foto & ${actionType === 'clock_in' ? 'Clock-In' : 'Clock-Out'}`}
                        </button>
                    </div>
                );
            default: return null;
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                {renderContent()}
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </div>
        </div>
    );
};


// =================================================================================
// KOMPONEN UTAMA HALAMAN ABSENSI
// =================================================================================
const HalamanAbsensi = () => {
    // State untuk data harian
    const [workerStatusList, setWorkerStatusList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [systemSetupMessage, setSystemSetupMessage] = useState('Mempersiapkan sistem...');
    const [searchTerm, setSearchTerm] = useState('');
    
    // State untuk Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ mode: '', worker: null, actionType: 'clock_in' });

    // === BARU: State untuk Laporan Mingguan ===
    const [absensiMingguan, setAbsensiMingguan] = useState([]);
    const [reportLoading, setReportLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

    // === BARU: Fungsi fetch data mingguan ===
    const fetchAbsensiMingguan = useCallback(async (tanggal) => {
        setReportLoading(true);
        try {
            console.log('Fetching weekly attendance for date:', tanggal);
            const { data } = await axiosInstance.get('/kehadiran/mingguan', { params: { tanggal } });
            console.log('Weekly attendance response:', data);
            setAbsensiMingguan(data);
        } catch (error) {
            console.error("Gagal mengambil data absensi mingguan:", error);
            console.error("Error response:", error.response?.data);
            setAbsensiMingguan([]);
        } finally {
            setReportLoading(false);
        }
    }, []);

    const fetchWorkerStatus = useCallback(async () => {
        try {
            console.log('Fetching worker status from:', '/kehadiran/status-harian');
            const { data } = await axiosInstance.get('/kehadiran/status-harian');
            console.log('Worker status response:', data);
            setWorkerStatusList(data);
        } catch (error) {
            console.error("Gagal mengambil status pekerja:", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
            // Set empty array to show "no workers" message instead of loading forever
            setWorkerStatusList([]);
        }
    }, []);

    // Inisialisasi sistem (memuat model face-api & data awal)
    const setupSystem = useCallback(async () => {
        setIsLoading(true);
        try {
            setSystemSetupMessage('Memuat model deteksi wajah...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            
            setSystemSetupMessage('Mengambil data hari ini dan mingguan...');
            // Panggil kedua fungsi fetch secara paralel untuk efisiensi
            await Promise.all([
                fetchWorkerStatus(),
                fetchAbsensiMingguan(new Date().toISOString().slice(0, 10))
            ]);

        } catch (error) {
            console.error("Inisialisasi sistem gagal:", error);
            setSystemSetupMessage('Gagal mempersiapkan sistem. Coba refresh halaman.');
        } finally {
            setIsLoading(false);
        }
    }, [fetchWorkerStatus, fetchAbsensiMingguan]);

    useEffect(() => {
        setupSystem();
    }, [setupSystem]);
    
    useEffect(() => {
        const result = workerStatusList.filter(w =>
            w.nama_pengguna.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.log('Worker status list:', workerStatusList);
        console.log('Search term:', searchTerm);
        console.log('Filtered result:', result);
        setFilteredList(result);
    }, [searchTerm, workerStatusList]);

    // === BARU: useEffect untuk memuat ulang laporan mingguan saat tanggal berubah ===
    useEffect(() => {
        fetchAbsensiMingguan(selectedDate);
    }, [selectedDate, fetchAbsensiMingguan]);


    const openModal = (mode, worker = null, actionType) => {
        setModalConfig({ mode, worker, actionType });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleActionComplete = () => {
        // Refresh kedua data setelah aksi berhasil
        fetchWorkerStatus();
        fetchAbsensiMingguan(selectedDate);
    };

    if (isLoading && workerStatusList.length === 0) {
        return <Layout><p className="p-10 text-center text-lg font-semibold animate-pulse">{systemSetupMessage}</p></Layout>;
    }

    return (
        <Layout>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Absensi Harian</h1>
                <div className="flex gap-2 sm:gap-4 w-full md:w-auto">
                    <button onClick={() => openModal('face', null, 'smart')} className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                        Absensi Wajah
                    </button>
                    <button onClick={() => openModal('qr', null, 'smart')} className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-sky-700 transition-colors">
                        Pindai QR Code
                    </button>
                </div>
            </div>

            {/* Bagian Status Pekerja Harian */}
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
                                                        <button onClick={() => openModal('manual', worker, 'clock_in')} className="text-green-600 hover:text-green-800 font-semibold">Clock-In</button>
                                                    )}
                                                    {clockedIn && !clockedOut && (
                                                        <button onClick={() => openModal('manual', worker, 'clock_out')} className="text-red-600 hover:text-red-800 font-semibold">Clock-Out</button>
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

            {/* === BARU: Bagian Laporan Mingguan === */}
            <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-xl font-semibold mb-4">Laporan Absensi Mingguan</h2>
                <div className="mb-6 flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                    <label htmlFor="week-picker" className="font-medium text-gray-700">Pilih Tanggal:</label>
                    <input type="date" id="week-picker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border-gray-300 rounded-md shadow-sm"/>
                </div>
                {reportLoading ? <p className="text-center p-4">Memuat laporan...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left table-auto text-sm">
                            <thead className="border-b-2 bg-gray-50">
                                <tr>
                                    <th className="p-3 font-semibold">Nama Pekerja</th>
                                    <th className="p-3 font-semibold hidden lg:table-cell">Jabatan</th>
                                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(h => <th key={h} className="p-3 font-semibold text-center">{h}</th>)}
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

            {/* Render Modal Terpusat */}
            <AttendanceModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onComplete={handleActionComplete}
                {...modalConfig}
            />
        </Layout>
    );
};

export default HalamanAbsensi;