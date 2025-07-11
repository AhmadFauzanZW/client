// src/components/ActivitySummary.jsx
// Komponen untuk menampilkan ringkasan aktivitas sistem

import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Bar, Pie, Line } from 'react-chartjs-2';

const ActivitySummary = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDateRange, setSelectedDateRange] = useState('7d');

    useEffect(() => {
        fetchActivitySummary();
    }, [selectedDateRange]);

    const fetchActivitySummary = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            
            switch (selectedDateRange) {
                case '1d':
                    startDate.setDate(endDate.getDate() - 1);
                    break;
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 7);
            }

            const response = await axiosInstance.get('/logs/summary', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    dateFrom: startDate.toISOString().split('T')[0],
                    dateTo: endDate.toISOString().split('T')[0]
                }
            });

            if (response.data.success) {
                setSummaryData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching activity summary:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!summaryData) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500">Gagal memuat data aktivitas</p>
            </div>
        );
    }

    const activityTypeChart = {
        labels: summaryData.activityTypes.map(item => item.aktivitas),
        datasets: [{
            label: 'Jumlah Aktivitas',
            data: summaryData.activityTypes.map(item => item.count),
            backgroundColor: [
                'rgba(59, 130, 246, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(245, 158, 11, 0.6)',
                'rgba(239, 68, 68, 0.6)',
                'rgba(139, 92, 246, 0.6)',
                'rgba(236, 72, 153, 0.6)',
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(239, 68, 68, 1)',
                'rgba(139, 92, 246, 1)',
                'rgba(236, 72, 153, 1)',
            ],
            borderWidth: 1
        }]
    };

    const roleActivityChart = {
        labels: summaryData.userRoleActivity.map(item => item.role),
        datasets: [{
            label: 'Aktivitas per Role',
            data: summaryData.userRoleActivity.map(item => item.activity_count),
            backgroundColor: [
                'rgba(168, 85, 247, 0.6)',
                'rgba(59, 130, 246, 0.6)',
                'rgba(16, 185, 129, 0.6)',
                'rgba(245, 158, 11, 0.6)',
            ]
        }]
    };

    const dailyTrendChart = {
        labels: summaryData.dailyTrend.map(item => 
            new Date(item.date).toLocaleDateString('id-ID', { 
                month: 'short', 
                day: 'numeric' 
            })
        ),
        datasets: [{
            label: 'Aktivitas Harian',
            data: summaryData.dailyTrend.map(item => item.count),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true
        }]
    };

    return (
        <div className="space-y-6">
            {/* Header with date range selector */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Analytics & Monitoring Aktivitas
                    </h2>
                    <div className="flex gap-2">
                        {[
                            { value: '1d', label: '24 Jam' },
                            { value: '7d', label: '7 Hari' },
                            { value: '30d', label: '30 Hari' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedDateRange(option.value)}
                                className={`px-3 py-1 rounded text-sm ${
                                    selectedDateRange === option.value
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {summaryData.activityTypes.reduce((sum, item) => sum + item.count, 0)}
                        </div>
                        <div className="text-sm text-blue-600">Total Aktivitas</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {summaryData.statusStats.find(s => s.status === 'SUCCESS')?.count || 0}
                        </div>
                        <div className="text-sm text-green-600">Sukses</div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                            {summaryData.statusStats.find(s => s.status === 'ERROR')?.count || 0}
                        </div>
                        <div className="text-sm text-red-600">Error</div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                            {summaryData.activeUsers.length}
                        </div>
                        <div className="text-sm text-yellow-600">Users Aktif</div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Types Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Jenis Aktivitas</h3>
                    <div className="h-64">
                        <Bar
                            data={activityTypeChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Role Activity Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Aktivitas per Role</h3>
                    <div className="h-64">
                        <Pie
                            data={roleActivityChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Tren Aktivitas Harian</h3>
                <div className="h-64">
                    <Line
                        data={dailyTrendChart}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Most Active Users */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Pengguna Paling Aktif</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b-2 border-gray-200">
                            <tr>
                                <th className="py-2">Nama</th>
                                <th className="py-2">Username</th>
                                <th className="py-2">Role</th>
                                <th className="py-2 text-center">Total Aktivitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryData.activeUsers.map((user, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-2 font-medium">{user.nama_pengguna}</td>
                                    <td className="py-2">{user.username}</td>
                                    <td className="py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            user.role === 'director' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                            user.role === 'supervisor' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-2 text-center font-semibold">
                                        {user.activity_count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ActivitySummary;
