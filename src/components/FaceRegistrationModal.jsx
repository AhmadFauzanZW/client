// components/FaceRegistrationModal.jsx
import { useState, useRef, useEffect } from 'react';

const FaceRegistrationModal = ({ isOpen, onClose, onSubmit, worker }) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (isOpen && isCapturing) {
            startCamera();
        } else {
            stopCamera();
        }
        
        return () => {
            stopCamera();
        };
    }, [isOpen, isCapturing]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 } 
                } 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Flip horizontal untuk mirror effect
            context.scale(-1, 1);
            context.translate(-canvas.width, 0);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageData);
            setIsCapturing(false);
            stopCamera();
        }
    };

    const handleSubmit = async () => {
        if (!capturedImage) {
            alert('Silakan ambil foto terlebih dahulu');
            return;
        }

        setIsProcessing(true);
        try {
            await onSubmit({
                faceImage: capturedImage
            });
        } catch (error) {
            console.error('Error submitting face data:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setIsCapturing(true);
    };

    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        setIsCapturing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {worker?.face_registered ? 'Update' : 'Daftar'} Wajah - {worker?.nama_pengguna}
                    </h2>
                    <button 
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {!isCapturing && !capturedImage && (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">📷</div>
                            <h3 className="text-lg font-medium mb-2">
                                {worker?.face_registered ? 'Update Foto Wajah' : 'Daftar Foto Wajah'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Pastikan wajah terlihat jelas dan dalam pencahayaan yang baik
                            </p>
                            <button
                                onClick={() => setIsCapturing(true)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                📸 Mulai Ambil Foto
                            </button>
                        </div>
                    )}

                    {isCapturing && (
                        <div className="text-center">
                            <div className="relative inline-block">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full max-w-md rounded-lg border-4 border-blue-500"
                                    style={{ transform: 'scaleX(-1)' }} // Mirror effect
                                />
                                <div className="absolute inset-0 border-2 border-white rounded-lg pointer-events-none">
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-yellow-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            
                            <div className="mt-4 space-x-4">
                                <button
                                    onClick={capturePhoto}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                >
                                    📸 Ambil Foto
                                </button>
                                <button
                                    onClick={() => setIsCapturing(false)}
                                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    )}

                    {capturedImage && (
                        <div className="text-center">
                            <div className="mb-4">
                                <img 
                                    src={capturedImage} 
                                    alt="Captured face" 
                                    className="w-full max-w-md rounded-lg mx-auto border-2 border-green-500"
                                />
                            </div>
                            
                            <div className="space-x-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isProcessing ? '⏳ Memproses...' : '✅ Simpan Wajah'}
                                </button>
                                <button
                                    onClick={handleRetake}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                                >
                                    🔄 Foto Ulang
                                </button>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </div>
        </div>
    );
};

export default FaceRegistrationModal;
