const StatusPersetujuan = ({ status }) => {
    // Komponen kecil untuk satu badge
    const Badge = ({ text, color }) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      {text}
    </span>
    );

    const getStatusUI = () => {
        switch (status) {
            case 'Menunggu Persetujuan Supervisor':
                return (
                    <>
                        <Badge text="Menunggu Supervisor" color="bg-yellow-100 text-yellow-800" />
                        <Badge text="Menunggu Manager" color="bg-gray-100 text-gray-800" />
                    </>
                );
            case 'Disetujui Supervisor':
                return (
                    <>
                        <Badge text="Disetujui Supervisor" color="bg-green-100 text-green-800" />
                        <Badge text="Menunggu Manager" color="bg-yellow-100 text-yellow-800" />
                    </>
                );
            case 'Menunggu Persetujuan Manager': // Untuk izin dari Supervisor
                return <Badge text="Menunggu Manager" color="bg-yellow-100 text-yellow-800" />;

            case 'Menunggu Persetujuan Direktur': // Untuk izin dari Manager
                return <Badge text="Menunggu Direktur" color="bg-yellow-100 text-yellow-800" />;

            case 'Disetujui':
                return <Badge text="Disetujui" color="bg-green-100 text-green-800" />;

            case 'Ditolak':
                return <Badge text="Ditolak" color="bg-red-100 text-red-800" />;

            default:
                return <Badge text={status} color="bg-gray-100 text-gray-800" />;
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {getStatusUI()}
        </div>
    );
};

export default StatusPersetujuan;