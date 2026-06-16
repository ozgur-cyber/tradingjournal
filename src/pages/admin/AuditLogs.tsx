import React, { useState, useEffect } from 'react';
import { History, Search, Shield, Eye, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase/config';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string;
  details: any;
  created_at: string;
  admin: {
    username: string;
    email: string;
  };
  target_user: {
    username: string;
  };
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id, action, details, created_at,
          admin:admin_id ( username, email ),
          target_user:target_user_id ( username )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        admin: Array.isArray(item.admin) ? item.admin[0] : item.admin,
        target_user: Array.isArray(item.target_user) ? item.target_user[0] : item.target_user
      }));

      setLogs(formattedData as AuditLog[]);
    } catch (err) {
      console.error("Loglar getirilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.action?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.admin?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.target_user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-500/20 rounded-xl">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Denetim Günlüğü</h2>
            <p className="text-text-secondary text-sm">Sistem üzerinde yapılan tüm admin müdahalelerinin kayıtları.</p>
          </div>
        </div>
      </div>

      <div className="glassmorphism rounded-2xl overflow-hidden border border-border-primary flex flex-col flex-1">
        <div className="p-5 border-b border-border-primary bg-bg-surface-hover/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-text-secondary" />
            <h3 className="font-bold text-white text-lg">Sistem Logları</h3>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Admin, Kullanıcı veya İşlem ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-border-primary rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:border-brand-purple/50 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto flex-1">
          {loading ? (
             <div className="p-20 text-center flex flex-col items-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-4"></div>
               <p className="text-text-secondary">Loglar yükleniyor...</p>
             </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Shield className="w-16 h-16 text-text-secondary opacity-20 mb-4" />
              <p className="text-text-primary font-bold text-xl">Log Kaydı Yok</p>
              <p className="text-text-secondary">Sistemde henüz kaydedilmiş bir admin aksiyonu bulunmuyor.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px] relative">
              <thead className="sticky top-0 bg-bg-surface shadow-md z-10">
                <tr className="border-b border-border-primary">
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Tarih</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Admin (Aktör)</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Aksiyon</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Hedef Kullanıcı</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">Detaylar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-surface-hover/30 transition-colors font-mono text-sm">
                    <td className="p-4 text-text-secondary">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-brand-purple">{log.admin?.username || 'Sistem'}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.target_user ? (
                        <span className="font-bold text-brand-danger">{log.target_user.username}</span>
                      ) : (
                        <span className="text-text-secondary italic">Genel</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {log.details ? (
                        <button 
                          onClick={() => alert(JSON.stringify(log.details, null, 2))}
                          className="p-1.5 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 rounded-lg transition-colors inline-block"
                          title="JSON Göster"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;