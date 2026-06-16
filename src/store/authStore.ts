import { create } from 'zustand';
import { supabase } from '@/lib/supabase/config';

interface UserData {
  id: string;
  email: string;
  username: string;
  role: 'User' | 'SeasonAdmin' | 'Moderator' | 'SuperAdmin' | 'Admin' | 'Founder';
  is_banned: boolean;
  total_trades: number;
  win_trades: number;
  total_pnl: number;
  win_rate: number;
  created_at: string;
  admin_passcode?: string;
  avatar_url?: string;
  warn_count?: number;
  ban_until?: string;
}

interface AuthState {
  user: any | null;
  userData: UserData | null;
  isLoading: boolean;
  initializeAuth: () => void;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  isLoading: true,

  initializeAuth: () => {
    // Session state dinleyici
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({ user: session.user });
        get().refreshUserData();
      } else {
        set({ user: null, userData: null, isLoading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({ user: session.user });
        get().refreshUserData();
      } else {
        set({ user: null, userData: null, isLoading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },

  refreshUserData: async () => {
    const { user } = get();
    if (!user) return;

    // Otomatik Founder yetkilendirmesi
    if (user.email === 'admin@gmail.com' || user.email === 'forexrico16@gmail.com') {
      await supabase.from('users').update({ role: 'Founder' }).eq('id', user.id);
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Eğer kayıt yoksa (PGRST116 hatası), otomatik oluştur
        if (error.code === 'PGRST116') {
          console.log("Kullanıcı profili bulunamadı, otomatik oluşturuluyor...");
          const newRole = (user.email === 'admin@gmail.com' || user.email === 'forexrico16@gmail.com') ? 'Founder' : 'User';
          
          await supabase.from('users').insert([{
            id: user.id,
            email: user.email,
            username: user.email.split('@')[0],
            role: newRole
          }]);
          
          // Yeni oluşturulan veriyi çek
          const retry = await supabase.from('users').select('*').eq('id', user.id).single();
          if (!retry.error && retry.data) {
            set({ userData: retry.data as UserData, isLoading: false });
            return;
          }
        }
        
        console.error("Kullanıcı verisi çekilemedi:", error);
        set({ userData: null, isLoading: false });
      } else {
        const parsedData = data as UserData;
        // Frontend tarafında yetkiyi zorla Founder yap
        if (user.email === 'admin@gmail.com' || user.email === 'forexrico16@gmail.com') {
          parsedData.role = 'Founder';
        }
        set({ userData: parsedData, isLoading: false });
      }
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, userData: null });
  },
}));
