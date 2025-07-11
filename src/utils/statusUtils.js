// utils/statusUtils.js
// Utility function for status badge styling

export const getStatusBadge = (status) => {
    switch (status) {
        case 'Hadir': return 'bg-green-100 text-green-800';
        case 'Telat': return 'bg-yellow-100 text-yellow-800';
        case 'Sakit': return 'bg-blue-100 text-blue-800';
        case 'Izin': return 'bg-purple-100 text-purple-800';
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
