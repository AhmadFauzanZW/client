import { useState, useEffect } from 'react';

export const useClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update waktu setiap detik
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Membersihkan interval saat komponen di-unmount
    return () => clearInterval(timerId);
  }, []);

  return time;
};