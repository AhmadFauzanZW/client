// kalender sederhana
const CalendarView = ({ attendanceData }) => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1); // Simulasi hari dalam sebulan

  const getStatusForDay = (day) => {
    // Di real case aplikasi, akan mencocokkan tanggal penuh
    // Ini hanya simulasi
    if (day === 20) return 'Hadir';
    if (day === 21) return 'Absen';
    if (day === 22) return 'Hadir';
    if (day === 23) return 'Terlambat';
    if (day === 24) return 'Hadir';

    return null;
  };

  const getStatusColor = (status) => {
      if (status === 'Hadir') return 'bg-green-500';
      if (status === 'Terlambat') return 'bg-yellow-500';
      if (status === 'Absen') return 'bg-red-500';
      return 'bg-gray-200';
  };

  return (
    <div className="bg-white p-2 rounded-lg">
      <h4 className="font-bold text-md mb-4">Tampilan Kalender Kehadiran (Juni 2025)</h4>
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const status = getStatusForDay(day);
          return (
            <div key={day} className={`p-2 border rounded-md text-center ${getStatusColor(status)}`}>
              <span className="font-medium">{day}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 font-semibold text-md">Keterangan:</div>
      <div className="mt-2 flex justify-start space-x-2">
        <div className="h-8 w-24 flex rounded bg-green-500 border-black border-1 justify-center items-center font-semibold">Hadir</div>
        <div className="h-8 w-24 flex rounded bg-yellow-500 border-black border-1 justify-center items-center font-semibold">Terlambat</div>
        <div className="h-8 w-24 flex rounded bg-red-500 border-black border-1 justify-center items-center font-semibold">Absen</div>
      </div>
    </div>
  );
};

export default CalendarView;