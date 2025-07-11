// components/QrGenerationModal.jsx
import { useState } from 'react';
import QRCode from 'qrcode';

const QrGenerationModal = ({ isOpen, onClose, onGenerate, worker }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [newQrCode, setNewQrCode] = useState('');

    const generateQrCode = async () => {
        setIsGenerating(true);
        try {
            // Generate unique QR code for worker dengan format yang konsisten
            const timestamp = Date.now();
            const paddedId = String(worker.id_pekerja).padStart(3, '0');
            const randomStr = Math.random().toString(36).substring(2, 8);
            const qrCodeValue = `EMP_${paddedId}_${randomStr}${timestamp.toString().slice(-6)}`;
            
            // Generate QR code image
            const qrImageUrl = await QRCode.toDataURL(qrCodeValue, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            setQrCodeImage(qrImageUrl);
            setNewQrCode(qrCodeValue);
        } catch (error) {
            console.error('Error generating QR code:', error);
            alert('Gagal generate QR code');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async () => {
        if (!newQrCode) {
            alert('Silakan generate QR code terlebih dahulu');
            return;
        }

        try {
            await onGenerate(worker.id_pekerja, newQrCode);
        } catch (error) {
            console.error('Error saving QR code:', error);
        }
    };

    const downloadQrCode = () => {
        if (qrCodeImage) {
            const link = document.createElement('a');
            link.download = `QR_${worker.nama_pengguna.replace(/\s+/g, '_')}_${worker.id_pekerja}.png`;
            link.href = qrCodeImage;
            link.click();
        }
    };

    const handleClose = () => {
        setQrCodeImage('');
        setNewQrCode('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {worker?.kode_qr ? 'Generate Ulang' : 'Generate'} QR Code - {worker?.nama_pengguna}
                    </h2>
                    <button 
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Current QR Info */}
                    {worker?.kode_qr && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-medium text-gray-700 mb-2">QR Code Saat Ini:</h3>
                            <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                                {worker.kode_qr}
                            </p>
                        </div>
                    )}

                    {/* Generate New QR */}
                    {!qrCodeImage && (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">📱</div>
                            <h3 className="text-lg font-medium mb-2">
                                {worker?.kode_qr ? 'Generate QR Code Baru' : 'Generate QR Code'}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                QR Code akan digunakan untuk absensi scan
                            </p>
                            <button
                                onClick={generateQrCode}
                                disabled={isGenerating}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isGenerating ? '⏳ Generating...' : '🔄 Generate QR Code'}
                            </button>
                        </div>
                    )}

                    {/* Display Generated QR */}
                    {qrCodeImage && (
                        <div className="text-center">
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                <img 
                                    src={qrCodeImage} 
                                    alt="Generated QR Code" 
                                    className="mx-auto mb-4"
                                />
                                <div className="text-sm text-gray-600">
                                    <p className="font-medium mb-1">QR Code untuk: {worker.nama_pengguna}</p>
                                    <p className="font-mono text-xs bg-white p-2 rounded border">
                                        {newQrCode}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="space-x-4">
                                <button
                                    onClick={handleSubmit}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                                >
                                    ✅ Simpan QR Code
                                </button>
                                <button
                                    onClick={downloadQrCode}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    💾 Download QR
                                </button>
                                <button
                                    onClick={() => {
                                        setQrCodeImage('');
                                        setNewQrCode('');
                                    }}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                                >
                                    🔄 Generate Ulang
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrGenerationModal;
