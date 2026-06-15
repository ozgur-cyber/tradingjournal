import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-ultra-dark text-white p-4">
      <div className="glassmorphism p-8 rounded-2xl max-w-md w-full text-center space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
          Ultimate Trading SaaS
        </h1>
        <p className="text-gray-400">
          Kurulum başarıyla tamamlandı. Kimlik Doğrulama test edilebilir.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="w-full py-3 px-4 bg-brand-purple hover:bg-brand-blue transition-colors rounded-lg font-medium cursor-pointer"
        >
          Giriş Yap / Kayıt Ol
        </button>
      </div>
    </div>
  );
};

export default Home;
