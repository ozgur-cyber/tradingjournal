import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  toggleFollow: (username: string) => void;
  toggleLike: (tradeId: string) => void;
  addComment: (tradeId: string, username: string, text: string) => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      followedUsers: [],
      likedTrades: [],
      comments: [],
      toggleFollow: (username) => set((state) => ({
        followedUsers: state.followedUsers.includes(username)
          ? state.followedUsers.filter(u => u !== username)
          : [...state.followedUsers, username]
      })),
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
