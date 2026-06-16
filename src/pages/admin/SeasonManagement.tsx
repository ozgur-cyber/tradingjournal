import React, { useState, useEffect } from 'react';
import { CalendarDays, Play, Square, Trophy, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

const SeasonManagement = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons();
  }, []);

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSeasons(data as Season[]);
    } catch (err) {
      console.error("Sezonlar getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeason = async () => {
    if (!window.confirm("Yeni sezon başlatmak istediğinize emin misiniz? Sistemdeki önceki aktif sezon bitirilecektir.")) return;
    
    try {
      // Önceki sezonu bitir
      await supabase
        .from('seasons')
        .update({ status: 'COMPLETED' })
        .eq('status', 'ACTIVE');

      // Yeni sezon oluştur
      const d = new Date();
      const endD = new Date();
      endD.setMonth(endD.getMonth() + 1); // 1 aylık sezon

      const { error } = await supabase
        .from('seasons')
        .insert([{
          name: `Sezon ${d.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}`,
          start_date: d.toISOString(),
          end_date: endD.toISOString(),
          status: 'ACTIVE'
        }]);

      if (error) throw error;
      
      alert("Yeni sezon başarıyla başlatıldı!");
      fetchSeasons();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const handleEndSeason = async (seasonId: string) => {
    if (!window.confirm("Bu sezonu erkenden bitirmek istediğinize emin misiniz?")) return;
    try {
      await supabase
        .from('seasons')
        .update({ status: 'COMPLETED', end_date: new Date().toISOString() })
        .eq('id', seasonId);
      
      fetchSeasons();
    } catch (err: any) {
      alert("Hata: " + err.message);
    }
  };

  const activeSeason = seasons.find(s => s.status === 'ACTIVE');

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-success/20 rounded-xl">
            <CalendarDays className="w-8 h-8 text-brand-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Sezon Yönetimi</h2>
            <p className="text-text-secondary text-sm">Turnuva dönemlerini ve ödül sezonlarını yönetin.</p>
          </div>
        </div>
        <button 
          onClick={handleCreateSeason}
          className="px-5 py-2.5 bg-brand-success hover:bg-brand-success/80 text-white font-bold rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
        >
          <Play className="w-4 h-4 fill-white" /> Yeni Sezon Başlat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glassmorphism p-8 rounded-2xl border border-brand-success/30 relative overflow-hidden flex flex-col justify-center items-center text-center">
          <Trophy className="w-16 h-16 text-brand-success mb-4" />
          {activeSeason ? (
            <>
              <p className="text-brand-success font-bold text-sm tracking-widest uppercase mb-2">Mevcut Aktif Sezon</p>
              <h3 className="text-3xl font-black text-white mb-2">{activeSeason.name}</h3>
              <p className="text-text-secondary text-sm">
                Bitiş: {new Date(activeSeason.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </>
          ) : (
            <>
              <p className="text-text-secondary font-bold text-sm tracking-widest uppercase mb-2">Şu an aktif sezon yok</p>
              <h3 className="text-2xl font-black text-white mb-2">Sezon Dışı</h3>
            </>
          )}
          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-brand-success/10 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        <div className="glassmorphism rounded-2xl overflow-hidden border border-border-primary flex flex-col h-[400px]">
          <div className="p-5 border-b border-border-primary bg-bg-surface-hover/50">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-blue" />
              Sezon Geçmişi
            </h3>
          </div>
          <div className="overflow-y-auto flex-1 p-5 space-y-3">
            {loading ? (
              <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div></div>
            ) : seasons.length === 0 ? (
              <div className="text-center p-10 text-text-secondary italic">Henüz hiç sezon oluşturulmadı.</div>
            ) : (
              seasons.map(season => (
                <div key={season.id} className="p-4 bg-bg-surface-hover/30 border border-border-primary rounded-xl flex items-center justify-between group hover:border-border-primary/80 transition-colors">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      {season.name}
                      {season.status === 'ACTIVE' && <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" title="Aktif"></span>}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">
                      {new Date(season.start_date).toLocaleDateString('tr-TR')} - {new Date(season.end_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    {season.status === 'ACTIVE' ? (
                      <button 
                        onClick={() => handleEndSeason(season.id)}
                        className="p-2 text-brand-danger bg-brand-danger/10 hover:bg-brand-danger hover:text-white rounded-lg transition-colors shadow-sm"
                        title="Sezonu Bitir"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary px-2 py-1 bg-black/40 rounded border border-border-primary">
                        <CheckCircle className="w-3 h-3" /> TAMAMLANDI
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonManagement;