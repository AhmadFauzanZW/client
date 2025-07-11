// components/absensi/AlternativeQrReader.jsx
import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';

const AlternativeQrReader = ({ onResult, style }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const [lastScan, setLastScan] = useState('');
    
    useEffect(() => {
        let mounted = true;
        
        const initializeScanner = async () => {
            try {
                // Create QR code reader
                codeReaderRef.current = new BrowserQRCodeReader();
                
                // Get video devices
                const videoDevices = await codeReaderRef.current.listVideoInputDevices();
                console.log('Available cameras:', videoDevices);
                
                if (videoDevices.length === 0) {
                    throw new Error('No camera devices found');
                }
                
                // Prefer back camera (environment) if available
                const selectedDevice = videoDevices.find(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('environment')
                ) || videoDevices[0];
                
                console.log('Selected camera:', selectedDevice);
                
                // Start camera stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: selectedDevice.deviceId,
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'environment'
                    }
                });
                
                if (videoRef.current && mounted) {
                    videoRef.current.srcObject = stream;
                    setCameraReady(true);
                    setError(null);
                    
                    // Start scanning
                    startScanning();
                }
                
            } catch (err) {
                console.error('Camera initialization error:', err);
                if (mounted) {
                    setError(`Camera error: ${err.message}`);
                }
            }
        };
        
        const startScanning = () => {
            if (!codeReaderRef.current || !videoRef.current) return;
            
            setIsScanning(true);
            
            // Decode QR codes from video stream
            codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
                if (result) {
                    const scannedText = result.getText();
                    console.log('QR Scanned:', scannedText);
                    
                    // Prevent duplicate scans within 2 seconds
                    if (scannedText !== lastScan) {
                        setLastScan(scannedText);
                        onResult({ text: scannedText });
                        
                        // Reset after 2 seconds to allow re-scanning
                        setTimeout(() => setLastScan(''), 2000);
                    }
                }
                
                if (error && error.name !== 'NotFoundException') {
                    console.warn('QR Scan Error:', error);
                }
            });
        };
        
        initializeScanner();
        
        return () => {
            mounted = false;
            
            // Cleanup
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
            
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
            
            setIsScanning(false);
            setCameraReady(false);
        };
    }, [onResult, lastScan]);
    
    return (
        <div style={style} className="relative overflow-hidden bg-black">
            <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror video
            />
            
            {!cameraReady && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p>Initializing camera...</p>
                        <p className="text-xs mt-2">Please allow camera access</p>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-sm text-center">
                    Error: {error}
                </div>
            )}
            
            {isScanning && cameraReady && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-red-500 rounded-lg animate-pulse"></div>
                    <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm">
                        Scanning...
                    </div>
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        📷 Camera Active
                    </div>
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        QR Scanner Ready
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlternativeQrReader;
