import React from 'react';
import { History } from 'lucide-react';

const AuditLogs = () => {
  return (
    <div className="bg-bg-surface border border-border-primary rounded-xl p-6">
      <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-border-primary">
        <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center">
          <History className="w-6 h-6 text-brand-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Logları</h1>
          <p className="text-text-secondary">Platformda yapılan admin aktiviteleri.</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-border-primary rounded-xl">
        <div className="text-center">
          <p className="text-text-secondary text-lg">Bu modül yapım aşamasındadır.</p>
          <p className="text-sm text-text-secondary mt-2 opacity-60">Supabase SQL tabloları oluşturulduktan sonra devreye alınacaktır.</p>
        </div>
      </div>
    </div>
  );
};
export default AuditLogs;
