import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role;

  // Shared routes (dipakai oleh banyak role)
  const sharedRoutes = {
    perizinan: [
      { path: '/pengajuan-izin', label: 'Pengajuan Izin', roles: ['Pekerja', 'Supervisor', 'Manager'] },
      { path: '/riwayat-izin', label: 'Riwayat Izin', roles: ['Pekerja', 'Supervisor', 'Manager', 'Direktur'] },
    ]
  };

  // Route berdasarkan role
  const menuByRole = {
    Supervisor: {
      dashboard: [{ path: '/supervisor/dashboard', label: 'Dashboard' }],
      absensi: [{ path: '/supervisor/absensi', label: 'Halaman Absensi' }],
      perizinan: [{ path: '/supervisor/validasi-izin', label: 'Validasi Izin' }],
    },
    Pekerja: {
      dashboard: [{ path: '/pekerja/profil', label: 'Profil & Dashboard' }],
    },
    Manager: {
      dashboard: [{ path: '/manager/dashboard', label: 'Dashboard Utama' }],
      pengelolaan: [{ path: '/manager/kelola-pekerja', label: 'Kelola Pekerja' }],
      pelaporan: [{ path: '/manager/laporan', label: 'Laporan Proyek' }],
    },
    Direktur: {
      dashboard: [{ path: '/direktur/dashboard', label: 'Dashboard Utama' }],
    }
  };

  // Bangun menu berdasarkan role + sharedRoutes yang sesuai
  const roleMenu = menuByRole[role] || {};
  const fullMenu = {
    ...roleMenu,
    perizinan: [
      ...(roleMenu.perizinan || []),
      ...(sharedRoutes.perizinan.filter(route => route.roles.includes(role)) || [])
    ]
  };

  return (
      <div
          className={`fixed inset-y-0 left-0 w-64 h-screen bg-gray-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out z-30 ${
              isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Absensi Proyek</h1>
          <button onClick={toggleSidebar} className="text-white md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigasi */}
        <nav className="flex-grow p-4 space-y-6 overflow-y-auto">
          {Object.entries(fullMenu).map(([section, items]) => (
              <div key={section}>
                <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-1 font-semibold">
                  {section === 'dashboard' ? 'Dashboard'
                      : section === 'absensi' ? 'Absensi'
                          : section === 'perizinan' ? 'Perizinan'
                              : section === 'pengelolaan' ? 'Pengelolaan'
                                  : section === 'pelaporan' ? 'Pelaporan'
                                      : section}
                </h3>
                <ul className="space-y-1">
                  {items.map(item => (
                      <li key={item.path}>
                        <Link
                            to={item.path}
                            className={`block px-4 py-2 rounded transition-colors ${
                                location.pathname.startsWith(item.path)
                                    ? 'bg-blue-600 text-white'
                                    : 'hover:bg-gray-700'
                            }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                  ))}
                </ul>
              </div>
          ))}
          {Object.keys(fullMenu).length === 0 && (
              <p className="text-sm text-gray-400">Tidak ada akses menu</p>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">© 2025 Absensi Proyek</p>
        </div>
      </div>
  );
};

export default Sidebar;
