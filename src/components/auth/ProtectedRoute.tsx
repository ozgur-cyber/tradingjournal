import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Ban, LogOut } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, userData, isLoading, signOut } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-ultra-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Banlı kullanıcıyı engelle
  if (userData?.is_banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="glassmorphism p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl border border-brand-danger/20 relative overflow-hidden">
          {/* Red glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-danger/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-brand-danger/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-brand-danger/15 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <Ban className="w-12 h-12 text-brand-danger" />
            </div>
            
            <h2 className="text-3xl font-black text-brand-danger mb-3">Hesabınız Askıya Alındı</h2>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              Hesabınız platform kurallarını ihlal ettiği gerekçesiyle bir yönetici tarafından askıya alınmıştır.
            </p>

            {(userData as any)?.ban_reason && (
              <div className="bg-brand-danger/5 border border-brand-danger/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-[10px] uppercase tracking-wider text-brand-danger font-bold mb-1">Askıya Alma Sebebi</p>
                <p className="text-text-secondary text-sm">{(userData as any).ban_reason}</p>
              </div>
            )}

            <p className="text-text-secondary text-xs mb-8">
              Bu kararın hatalı olduğunu düşünüyorsanız lütfen destek ekibiyle iletişime geçin.
            </p>

            <button 
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-danger/10 text-brand-danger border border-brand-danger/30 rounded-xl font-bold hover:bg-brand-danger/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
