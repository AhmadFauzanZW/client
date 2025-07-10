// src/pages/UnauthorizedPage.jsx
import React from 'react';

const UnauthorizedPage = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
        <p className="text-lg text-gray-700 mb-6">Anda tidak memiliki akses ke halaman ini.</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;