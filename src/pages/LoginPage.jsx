import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { loginAction } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Kirim permintaan login ke backend
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      // Simpan data user & token via context
      loginAction(response.data);

      // Redirect berdasarkan role
      const userRole = response.data.user.role;

      switch (userRole) {
        case 'Supervisor':
          navigate('/supervisor/dashboard');
          break;
        case 'Pekerja':
          navigate('/pekerja/profil');
          break;
        case 'Manager':
          navigate('/manager/dashboard');
          break;
        case 'Direktur':
          navigate('/direktur/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      // Tampilkan pesan error dari server atau fallback
      const errorMessage =
        err.response?.data?.message || 'Login gagal. Periksa kembali email atau kata sandi.';
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login Sistem Absensi Pekerja</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;