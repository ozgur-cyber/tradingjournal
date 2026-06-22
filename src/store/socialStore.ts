import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase/config';

interface Comment {
  id: string;
  tradeId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface SocialState {
  followedUsers: string[]; 
  likedTrades: string[]; 
  comments: Comment[];
  fetchFollows: (currentUserId: string) => Promise<void>;
  toggleFollow: (username: string) => void;
  toggleFollowDB: (followerId: string, followingId: string, followingUsername: string) => Promise<void>;
  toggleLike: (tradeId: string) => void;
  addComment: (tradeId: string, username: string, text: string) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      followedUsers: [],
      likedTrades: [],
      comments: [],
      fetchFollows: async (currentUserId) => {
        try {
          const { data, error } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId);

          if (error) throw error;

          if (data && data.length > 0) {
            const ids = data.map(f => f.following_id);
            const { data: users, error: usersError } = await supabase
              .from('users')
              .select('username')
              .in('id', ids);

            if (!usersError && users) {
              const usernames = users.map(u => u.username).filter(Boolean);
              set({ followedUsers: usernames });
            }
          } else {
            set({ followedUsers: [] });
          }
        } catch (error) {
          console.error("Takip edilenler yüklenirken hata:", error);
        }
      },
      toggleFollow: (username) => set((state) => ({
        followedUsers: state.followedUsers.includes(username)
          ? state.followedUsers.filter(u => u !== username)
          : [...state.followedUsers, username]
      })),
      toggleFollowDB: async (followerId, followingId, followingUsername) => {
        try {
          const isFollowing = get().followedUsers.includes(followingUsername);
          
          if (isFollowing) {
            const { error } = await supabase
              .from('follows')
              .delete()
              .eq('follower_id', followerId)
              .eq('following_id', followingId);
            
            if (error) throw error;
            
            set((state) => ({
              followedUsers: state.followedUsers.filter(u => u !== followingUsername)
            }));
          } else {
            const { error } = await supabase
              .from('follows')
              .insert({
                follower_id: followerId,
                following_id: followingId
              });
            
            if (error) throw error;
            
            set((state) => ({
              followedUsers: [...state.followedUsers, followingUsername]
            }));
          }
        } catch (error) {
          console.error("Takip işlemi sırasında hata:", error);
          // Fallback to local storage toggle if DB fails (e.g. table doesn't exist yet)
          get().toggleFollow(followingUsername);
        }
      },
      toggleLike: (tradeId) => set((state) => ({
        likedTrades: state.likedTrades.includes(tradeId)
          ? state.likedTrades.filter(id => id !== tradeId)
          : [...state.likedTrades, tradeId]
      })),
      addComment: (tradeId, username, text) => set((state) => ({
        comments: [...state.comments, {
          id: Date.now().toString(),
          tradeId,
          username,
          text,
          createdAt: new Date().toISOString()
        }]
      }))
    }),
    {
      name: 'social-storage'
    }
  )
);

