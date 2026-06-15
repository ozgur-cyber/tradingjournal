import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, TrendingUp, Activity, Users, Shield, Zap, ArrowRight, BarChart3, Lock } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple/30 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-blue/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-border-primary bg-bg-surface/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
              TradeJournal
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-text-secondary hover:text-text-primary font-medium transition-colors"
            >
              Giriş Yap
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-brand-purple to-brand-blue text-white px-6 py-2.5 rounded-xl font-medium shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-0.5"
            >
              Kayıt Ol
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            <span>Yeni Nesil Trade Günlüğü Yayında</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Trade Performansınızı <br />
            <span className="bg-gradient-to-r from-brand-purple via-brand-blue to-brand-purple bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
              Zirveye Taşıyın
            </span>
          </h1>
          
          <p className="mt-4 text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            İşlemlerinizi kaydedin, detaylı istatistiklerle hatalarınızı analiz edin ve global Liderlik Tablosu'nda diğer traderlarla rekabet edin.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto group relative px-8 py-4 bg-gradient-to-r from-brand-purple to-brand-blue text-white text-lg font-bold rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_50px_rgba(139,92,246,0.6)] transition-all hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center space-x-2">
                <span>Ücretsiz Başlayın</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 bg-bg-surface border border-border-primary text-text-primary text-lg font-bold rounded-2xl hover:bg-bg-surface-hover transition-all"
            >
              Hesabınız Var Mı?
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-brand-purple" />}
              title="Detaylı Analitik"
              description="Win rate, ortalama risk-ödül (RR) ve PnL istatistiklerinizi otomatik olarak hesaplayıp görselleştirin."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-brand-blue" />}
              title="Global Liderlik Tablosu"
              description="Platformdaki en iyi traderları görün, win rate ve ortalama RR değerleriyle kendinizi kıyaslayın."
            />
            <FeatureCard 
              icon={<Lock className="w-8 h-8 text-brand-purple" />}
              title="Güvenli ve Gizli"
              description="Tüm verileriniz uçtan uca şifrelenir. Stratejileriniz ve özel notlarınız sadece size aittir."
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="glassmorphism p-8 rounded-3xl border border-border-primary hover:border-brand-purple/30 transition-all hover:-translate-y-2 group">
    <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-text-primary mb-3">{title}</h3>
    <p className="text-text-secondary leading-relaxed">{description}</p>
  </div>
);

export default Home;
