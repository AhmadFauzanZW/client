// src/pages/HalamanAbsensi.jsx

import { useState } from 'react';
import Layout from '../components/Layout';
import AttendanceModal from '../components/absensi/AttendanceModal';
import DailyStatusTable from '../components/absensi/DailyStatusTable';
import WeeklyReport from '../components/absensi/WeeklyReport';
import { useAttendanceData } from '../hooks/useAttendanceData';

const HalamanAbsensi = () => {
    // State untuk Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ mode: '', worker: null, actionType: 'clock_in' });

    // Use custom hook for data management
    const {
        workerStatusList,
        isLoading,
        systemSetupMessage,
        absensiMingguan,
        reportLoading,
        selectedDate,
        setSelectedDate,
        handleActionComplete
    } = useAttendanceData();

    const openModal = (mode, worker = null, actionType) => {
        setModalConfig({ mode, worker, actionType });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    if (isLoading && workerStatusList.length === 0) {
        return (
            <Layout>
                <p className="p-10 text-center text-lg font-semibold animate-pulse">
                    {systemSetupMessage}
                </p>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Manajemen Absensi Harian</h1>
                <div className="flex gap-2 sm:gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => openModal('face', null, 'smart')} 
                        className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                        Absensi Wajah
                    </button>
                    <button 
                        onClick={() => openModal('qr', null, 'smart')} 
                        className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-sky-700 transition-colors"
                    >
                        Pindai QR Code
                    </button>
                </div>
            </div>

            {/* Daily Status Table */}
            <DailyStatusTable 
                workerStatusList={workerStatusList}
                isLoading={isLoading}
                onOpenModal={openModal}
            />

            {/* Weekly Report */}
            <WeeklyReport 
                absensiMingguan={absensiMingguan}
                reportLoading={reportLoading}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />

            {/* Attendance Modal */}
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
