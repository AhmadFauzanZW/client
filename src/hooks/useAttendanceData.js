// hooks/useAttendanceData.js
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import * as faceapi from 'face-api.js';

export const useAttendanceData = () => {
    // State untuk data harian
    const [workerStatusList, setWorkerStatusList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [systemSetupMessage, setSystemSetupMessage] = useState('Mempersiapkan sistem...');
    
    // State untuk Laporan Mingguan
    const [absensiMingguan, setAbsensiMingguan] = useState([]);
    const [reportLoading, setReportLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

    // Fungsi fetch data mingguan
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
            setWorkerStatusList([]);
        }
    }, []);

    // Inisialisasi sistem (memuat model face-api & data awal)
    const setupSystem = useCallback(async () => {
        setIsLoading(true);
        try {
            setSystemSetupMessage('Memuat model pengenalan wajah...');
            
            // Use the simplified face API manager
            const faceApiManager = (await import('../utils/faceApiUtils')).default;
            await faceApiManager.initialize();
            
            console.log('Face recognition models loaded successfully');
            
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

    // useEffect untuk memuat ulang laporan mingguan saat tanggal berubah
    useEffect(() => {
        fetchAbsensiMingguan(selectedDate);
    }, [selectedDate, fetchAbsensiMingguan]);

    const handleActionComplete = () => {
        // Refresh kedua data setelah aksi berhasil
        fetchWorkerStatus();
        fetchAbsensiMingguan(selectedDate);
    };

    return {
        // Data states
        workerStatusList,
        isLoading,
        systemSetupMessage,
        absensiMingguan,
        reportLoading,
        selectedDate,
        setSelectedDate,
        
        // Functions
        fetchWorkerStatus,
        fetchAbsensiMingguan,
        handleActionComplete
    };
};
