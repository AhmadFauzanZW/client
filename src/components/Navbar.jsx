import { useAuth } from '../context/AuthContext';
import { useClock } from '../hooks/useClock';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const currentTime = useClock();

  // Format tanggal dan waktu
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

  const formattedDate = currentTime.toLocaleDateString('id-ID', dateOptions);
  const formattedTime = currentTime.toLocaleTimeString('id-ID', timeOptions);

  const handleLogout = () => {
    logOut(); // Hapus data pengguna dan token
    navigate('/login'); // Arahkan ke halaman login
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
      <div className="flex items-center">
        {/* Tombol Hamburger */}
        <button onClick={toggleSidebar} className="text-gray-700 md:hidden mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Tampilkan Jam dan Tanggal, hanya di layar lg ke atas */}
        <div className="hidden lg:block ml-6">
          <p className="font-semibold text-gray-800">{formattedTime}</p>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Info Pengguna dan Tombol Logout */}
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="font-medium">{user?.name || 'Pengguna'}</p>
          <p className="text-sm text-gray-500">{user?.role || 'Role'}</p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded cursor-pointer">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;