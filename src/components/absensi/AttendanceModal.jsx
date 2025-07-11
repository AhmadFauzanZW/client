// components/absensi/AttendanceModal.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Webcam from 'react-webcam';
import CustomQrReader from './CustomQrReader';
// import AlternativeQrReader from './AlternativeQrReader'; // Fallback QR reader
import pythonFaceService from '../../utils/faceRecognitionService';

const AttendanceModal = ({ isOpen, onClose, onComplete, mode, worker, actionType }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [allWorkers, setAllWorkers] = useState([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const [selectedWorkerStatus, setSelectedWorkerStatus] = useState(null);
    const [detectedAction, setDetectedAction] = useState('clock_in');
    
    // State baru untuk Face Recognition
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [awaitingApproval, setAwaitingApproval] = useState(false);
    const [recognizedWorker, setRecognizedWorker] = useState(null);
    const [confidence, setConfidence] = useState(0);
    const [faceServiceHealthy, setFaceServiceHealthy] = useState(false);
    const [isRecognitionActive, setIsRecognitionActive] = useState(false);
    
    const videoRef = useRef();
    const webcamRef = useRef();
    const intervalRef = useRef();
    const recognitionIntervalRef = useRef();

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
                    
                    // Check Python face service health
                    checkFaceServiceHealth();
                })
                .catch(err => setError('Gagal memuat daftar pekerja.'));
        }
    }, [mode, isOpen]);

    // Check face service health
    const checkFaceServiceHealth = async () => {
        try {
            setIsRecognizing(true);
            const isHealthy = await pythonFaceService.checkHealth();
            setFaceServiceHealthy(isHealthy);
            if (!isHealthy) {
                setError('Python Face Recognition Service tidak berjalan. Gunakan mode manual.');
            }
        } catch (error) {
            console.error('Face service health check failed:', error);
            setFaceServiceHealthy(false);
            setError('Tidak dapat menghubungi Face Recognition Service.');
        } finally {
            setIsRecognizing(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
            setError('');
            setCapturedImage(null);
            setSelectedWorkerStatus(null);
            setDetectedAction('clock_in');
            setIsRecognizing(false);
            setAwaitingApproval(false);
            setRecognizedWorker(null);
            setConfidence(0);
            setFaceServiceHealthy(false);
            setIsRecognitionActive(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (recognitionIntervalRef.current) clearInterval(recognitionIntervalRef.current);
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        }
    }, [isOpen]);

    // Stop face recognition
    const stopFaceRecognition = useCallback(() => {
        if (recognitionIntervalRef.current) {
            clearInterval(recognitionIntervalRef.current);
            recognitionIntervalRef.current = null;
        }
        setIsRecognitionActive(false);
    }, []);

    // Fungsi untuk pengenalan wajah menggunakan Python service
    const startFaceRecognition = useCallback(() => {
        if (!videoRef.current || !faceServiceHealthy || awaitingApproval || isRecognitionActive) return;
        
        // Clear any existing interval
        stopFaceRecognition();
        setIsRecognitionActive(true);
        
        recognitionIntervalRef.current = setInterval(async () => {
            try {
                // Check if still in face mode and not awaiting approval
                if (awaitingApproval || mode !== 'face') {
                    console.log('Stopping face recognition: mode changed or awaiting approval');
                    stopFaceRecognition();
                    return;
                }
                
                // Check if video element is ready
                if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                    console.log('Video not ready, skipping frame');
                    return;
                }
                
                console.log('Capturing frame for face recognition...');
                
                // Capture current frame
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Fix canvas performance warning
                
                if (!ctx) return;
                
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);
                
                console.log('Sending image to face recognition service...');
                
                // Send to Python face recognition service
                const result = await pythonFaceService.recognizeFace(imageBase64);
                
                console.log('Face recognition result:', result);
                
                if (result.success && result.worker) {
                    const workerId = result.worker.worker_id;
                    const worker = allWorkers.find(w => w.id_pekerja === workerId);
                    
                    console.log('Worker found in database:', worker);
                    console.log('Confidence:', result.confidence);
                    
                    // Turunkan threshold menjadi 60% untuk testing
                    if (worker && result.confidence >= 60) { 
                        console.log(`Face recognized: ${worker.nama_pengguna} (${result.confidence.toFixed(1)}% confidence)`);
                        
                        // Stop recognition immediately
                        stopFaceRecognition();
                        
                        // Set recognition results
                        setRecognizedWorker(worker);
                        setConfidence(result.confidence);
                        setCapturedImage(imageBase64);
                        setSelectedWorkerId(workerId);
                        setSelectedWorkerStatus(worker);
                        
                        // Determine action type
                        const hasClockIn = !!worker.waktu_clock_in;
                        const hasClockOut = !!worker.waktu_clock_out;
                        setDetectedAction(hasClockIn && !hasClockOut ? 'clock_out' : 'clock_in');
                        
                        // Wait for supervisor approval
                        setAwaitingApproval(true);
                        
                        console.log('Set awaiting approval to true');
                    } else {
                        console.log(`Confidence too low: ${result.confidence}% or worker not found`);
                    }
                } else {
                    console.log('No face recognized or API error:', result.message || 'Unknown error');
                }
                
            } catch (error) {
                console.error('Face recognition error:', error);
                // Don't stop recognition on errors, just log them
            }
        }, 3000); // Check every 3 seconds - lebih lambat untuk debugging
    }, [allWorkers, faceServiceHealthy, awaitingApproval, mode, stopFaceRecognition, isRecognitionActive]);

    // Auto-start face recognition when video is ready and service is healthy
    const handleVideoPlay = useCallback(() => {
        if (faceServiceHealthy && !awaitingApproval && mode === 'face') {
            setTimeout(() => startFaceRecognition(), 2000); // Wait 2 seconds for video to stabilize
        }
    }, [faceServiceHealthy, startFaceRecognition, awaitingApproval, mode]);

    // Stop face recognition when mode changes or modal closes
    useEffect(() => {
        if (mode !== 'face') {
            stopFaceRecognition();
        }
    }, [mode, stopFaceRecognition]);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            stopFaceRecognition();
            setAwaitingApproval(false);
            setRecognizedWorker(null);
            setCapturedImage(null);
        }
    }, [isOpen, stopFaceRecognition]);

    // Fungsi untuk approval supervisor
    const approveFaceRecognition = () => {
        if (!recognizedWorker || !capturedImage) return;
        
        handleSubmit({
            id_pekerja: recognizedWorker.id_pekerja,
            tipe_aksi: detectedAction,
            metode: 'Wajah',
            fotoB64: capturedImage,
            id_lokasi: 1,
            confidence: confidence,
            recognized_worker: recognizedWorker.nama_pengguna
        });
    };

    // Fungsi untuk menolak dan restart recognition
    const rejectFaceRecognition = () => {
        stopFaceRecognition();
        setAwaitingApproval(false);
        setRecognizedWorker(null);
        setConfidence(0);
        setCapturedImage(null);
        
        // Restart face recognition after 1 second
        setTimeout(() => {
            if (faceServiceHealthy && mode === 'face') {
                startFaceRecognition();
            }
        }, 1000);
    };

    // Fungsi untuk restart manual recognition
    const restartRecognition = () => {
        stopFaceRecognition();
        setAwaitingApproval(false);
        setRecognizedWorker(null);
        setConfidence(0);
        setCapturedImage(null);
        
        if (faceServiceHealthy && mode === 'face') {
            startFaceRecognition();
        } else {
            checkFaceServiceHealth();
        }
    };

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

    useEffect(() => {
        if (mode === 'face' && isOpen && !capturedImage) {
            // Request camera access with better error handling
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            })
                .then(stream => { 
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        console.log('Camera stream initialized successfully');
                    }
                })
                .catch(err => {
                    console.error('Camera access error:', err);
                    let errorMessage = "Tidak bisa mengakses kamera.";
                    if (err.name === 'NotAllowedError') {
                        errorMessage = "Akses kamera ditolak. Silakan izinkan akses kamera dan refresh halaman.";
                    } else if (err.name === 'NotFoundError') {
                        errorMessage = "Kamera tidak ditemukan. Pastikan kamera terhubung.";
                    }
                    setError(errorMessage);
                });
        }
        return () => { 
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Clean up camera stream
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, [mode, isOpen, capturedImage]);

    const confirmFaceAttendance = () => {
        // Untuk mode face recognition otomatis, gunakan approveFaceRecognition
        if (recognizedWorker && awaitingApproval) {
            approveFaceRecognition();
            return;
        }
        
        // Untuk mode manual (fallback jika face recognition gagal)
        if (!selectedWorkerId || !capturedImage) return;
        handleSubmit({
            id_pekerja: selectedWorkerId,
            tipe_aksi: detectedAction,
            metode: 'Wajah (Manual)',
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

    const renderContent = () => {
        switch (mode) {
            case 'face':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-center">Face Recognition Absensi</h2>
                        
                        {isRecognizing && (
                            <div className="text-center mb-4">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-blue-600">Memeriksa Python Face Recognition Service...</p>
                            </div>
                        )}
                        
                        {!capturedImage && !isRecognizing ? (
                            <>
                                <div className="text-center mb-4">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <span className={`w-3 h-3 rounded-full ${faceServiceHealthy ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <p className="text-sm text-gray-600">
                                            Python Service: {faceServiceHealthy ? '✅ Online' : '❌ Offline'}
                                        </p>
                                    </div>
                                    <p className="text-sm text-green-600 font-medium">
                                        {faceServiceHealthy 
                                            ? 'Posisikan wajah di depan kamera untuk pengenalan otomatis'
                                            : 'Service tidak tersedia, gunakan tombol "Ambil Foto Manual"'
                                        }
                                    </p>
                                </div>
                                <div className={`relative w-full max-w-lg mx-auto h-72 bg-gray-900 rounded-lg overflow-hidden border-4 ${faceServiceHealthy ? 'border-green-400' : 'border-red-400'}`}>
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        onPlay={handleVideoPlay} 
                                        style={{ transform: 'scaleX(-1)', width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 ${faceServiceHealthy ? 'border-green-400' : 'border-red-400'} rounded-lg ${isRecognitionActive ? 'animate-pulse' : ''}`}></div>
                                        <div className={`absolute bottom-4 left-4 ${faceServiceHealthy ? 'bg-green-500' : 'bg-red-500'} text-white px-3 py-1 rounded text-sm`}>
                                            {faceServiceHealthy ? (isRecognitionActive ? 'Scanning for faces...' : 'Ready to scan') : 'Service offline'}
                                        </div>
                                        {isRecognitionActive && (
                                            <div className="absolute top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                                                🔍 Analyzing...
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-4 text-center">
                                    <button 
                                        onClick={() => {
                                            // Force manual capture if recognition fails
                                            const canvas = document.createElement('canvas');
                                            canvas.width = videoRef.current.videoWidth;
                                            canvas.height = videoRef.current.videoHeight;
                                            const ctx = canvas.getContext('2d', { willReadFrequently: true });
                                            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                                            setCapturedImage(canvas.toDataURL('image/jpeg'));
                                        }}
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                                    >
                                        Ambil Foto Manual
                                    </button>
                                </div>
                            </>
                        ) : capturedImage && awaitingApproval && recognizedWorker ? (
                            <>
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-2">
                                        <span className="text-lg">🎯</span>
                                        <span className="font-semibold">Wajah Terdeteksi!</span>
                                    </div>
                                </div>
                                
                                <img src={capturedImage} alt="Bukti Absen" className="w-full rounded-lg mb-4 border-2 border-green-400" style={{ transform: 'scaleX(-1)' }}/>
                                
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-green-800 mb-2">{recognizedWorker.nama_pengguna}</h3>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-sm text-gray-600">Tingkat Kepercayaan:</span>
                                            <span className={`font-bold text-lg ${confidence >= 85 ? 'text-green-600' : confidence >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {confidence}%
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-3">
                                            <p>Aksi: <span className="font-semibold text-blue-600">{detectedAction === 'clock_in' ? 'Clock-In' : 'Clock-Out'}</span></p>
                                            {selectedWorkerStatus && (
                                                <div className="mt-2 text-xs">
                                                    <p>Clock-In: {selectedWorkerStatus.waktu_clock_in ? new Date(selectedWorkerStatus.waktu_clock_in).toLocaleTimeString('id-ID') : 'Belum'}</p>
                                                    <p>Clock-Out: {selectedWorkerStatus.waktu_clock_out ? new Date(selectedWorkerStatus.waktu_clock_out).toLocaleTimeString('id-ID') : 'Belum'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <p className="text-center text-sm font-medium text-gray-700 mb-3">
                                        Supervisor, apakah pengenalan wajah ini benar?
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={approveFaceRecognition} 
                                            disabled={isProcessing} 
                                            className="bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? 'Memproses...' : (
                                                <>
                                                    <span>✅</span>
                                                    <span>Setuju</span>
                                                </>
                                            )}
                                        </button>
                                        <button 
                                            onClick={rejectFaceRecognition} 
                                            disabled={isProcessing} 
                                            className="bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <span>❌</span>
                                            <span>Tolak</span>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={restartRecognition} 
                                        disabled={isProcessing} 
                                        className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
                                    >
                                        🔄 Scan Ulang
                                    </button>
                                </div>
                            </>
                        ) : capturedImage ? (
                            <>
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-2">
                                        <span className="text-lg">📷</span>
                                        <span className="font-semibold">Mode Manual</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Pengenalan wajah otomatis tidak berhasil</p>
                                </div>
                                
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
                        ) : null}
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
                            {isProcessing ? 'Memproses...' : (actionType === 'clock_in' ? 'Ambil Foto & Clock-In' : 'Ambil Foto & Clock-Out')}
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

export default AttendanceModal;
