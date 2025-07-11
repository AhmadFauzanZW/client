// components/absensi/CustomQrReader.jsx
import { useState, useEffect, useRef } from 'react';
import { QrReader } from 'react-qr-reader';

const CustomQrReader = ({ onResult, style }) => {
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);
    const [lastScan, setLastScan] = useState('');
    const [cameraReady, setCameraReady] = useState(false);
    const [scanPaused, setScanPaused] = useState(false);
    const [scanCooldown, setScanCooldown] = useState(0);
    const videoRef = useRef(null);
    
    // Reset camera state when component mounts
    useEffect(() => {
        setCameraReady(false);
        setError(null);
        setIsScanning(true);
        
        // Give camera time to initialize
        const timer = setTimeout(() => {
            setCameraReady(true);
        }, 1500); // Increased delay for better camera initialization
        
        return () => {
            clearTimeout(timer);
            // Cleanup video stream when component unmounts
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);
    
    const handleResult = (result, error) => {
        // Don't process if scanning is paused or in cooldown
        if (scanPaused || scanCooldown > 0) {
            return;
        }
        
        if (result) {
            const scannedText = result.text;
            console.log('QR Scanned:', scannedText);
            
            // Prevent duplicate scans and add longer cooldown
            if (scannedText !== lastScan) {
                setLastScan(scannedText);
                setScanPaused(true); // Pause scanning immediately
                setIsScanning(false);
                
                // Show countdown
                setScanCooldown(10); // 10 second cooldown
                const countdownInterval = setInterval(() => {
                    setScanCooldown(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownInterval);
                            setScanPaused(false);
                            setIsScanning(true);
                            setLastScan(''); // Clear last scan to allow re-scanning
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                
                // Process the QR result
                onResult(result);
            }
        }
        
        // Perbaikan error handling yang lebih robust
        if (error && !scanPaused) {
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
        <div style={style} className="relative overflow-hidden">
            {cameraReady ? (
                <div className="w-full h-full relative">
                    <QrReader
                        onResult={handleResult}
                        style={{ 
                            width: '100%', 
                            height: '100%'
                        }}
                        constraints={{
                            facingMode: 'environment',
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        }}
                        delay={100}
                        scanDelay={scanPaused ? false : 100} // Disable scanning when paused
                        videoStyle={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block' // Ensure video is visible
                        }}
                        videoContainerStyle={{
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            backgroundColor: '#000'
                        }}
                    />
                </div>
            ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p>Initializing camera...</p>
                        <p className="text-xs mt-2">Please wait...</p>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-sm text-center">
                    Error: {error}
                </div>
            )}
            
            {isScanning && cameraReady && !scanPaused && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-red-500 rounded-lg animate-pulse"></div>
                    <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm">
                        Scanning...
                    </div>
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        📷 Camera Active
                    </div>
                </div>
            )}
            
            {scanPaused && cameraReady && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-orange-500 rounded-lg"></div>
                    <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-3 py-1 rounded text-sm">
                        Scan Paused
                    </div>
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-2 py-1 rounded text-xs">
                        ⏱️ Cooldown: {scanCooldown}s
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded text-center">
                        <div className="text-lg font-bold">✅ QR Berhasil Di-scan!</div>
                        <div className="text-sm">Tunggu {scanCooldown} detik untuk scan berikutnya</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomQrReader;
