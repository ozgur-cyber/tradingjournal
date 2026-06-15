import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "Giriş yapılamadı. E-posta veya şifre hatalı.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-brand-surface/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-brand-blue/5" />
      
      <div className="relative w-full max-w-md">
        <div className="glassmorphism p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10">
          
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)] group-hover:scale-105 transition-transform">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz</h2>
            <p className="text-gray-400">Trade günlüğünüze erişmek için giriş yapın</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value.replace(/ı/g, 'i').replace(/İ/g, 'i'))}
                  placeholder="ornek@email.com" 
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-gray-300">Şifre</label>
                <a href="#" className="text-xs text-brand-purple hover:text-brand-purple/80 transition-colors">
                  Şifremi Unuttum
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group bg-gradient-to-r from-brand-purple to-brand-blue text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-brand-purple font-bold hover:text-brand-purple/80 transition-colors">
              Hemen Oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
