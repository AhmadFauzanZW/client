import { createContext, useState, useContext } from 'react';

// 1. Membuat Context
const AuthContext = createContext(null);

// 2. Membuat Provider Component
export const AuthProvider = ({ children }) => {
  // State untuk menyimpan data pengguna dan token
  // Kita coba ambil dari localStorage jika ada (untuk session persistence)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Fungsi untuk handle login
  const loginAction = (data) => {
    // data ini seharusnya didapat dari response API setelah login berhasil
    // Contoh data: { token: 'xyz123', user: { name: 'Budi', role: 'Supervisor' } }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  };

  // Fungsi untuk handle logout
  const logOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, loginAction, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Custom Hook untuk mempermudah penggunaan context
export const useAuth = () => {
  return useContext(AuthContext);
};