// stores/profile.store.ts
import { create } from "zustand";
import { api } from "../lib/api";
import type { FriendshipStatus, FriendshipStatusView, Post, User } from "../types";

interface ProfileStore {
  // Profile
  profileUser: User | null;
  isLoadingProfile: boolean;
  fetchProfile: (username: string) => Promise<void>;

  // Friendship Status
  friendshipStatus: { status: FriendshipStatusView; friendshipId: string | null } | null;
  isLoadingStatus: boolean;
  fetchFriendshipStatus: (userId: string) => Promise<void>;

  // Posts
  posts: Post[];
  hasMorePosts: boolean;
  nextCursor: string | null;
  isLoadingPosts: boolean;
  isFetchingMore: boolean;

  fetchPosts: (userId: string, reset?: boolean) => Promise<void>;
  fetchMorePosts: (userId: string) => Promise<void>;

  // Reset
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profileUser: null,
  isLoadingProfile: false,

  friendshipStatus: null,
  isLoadingStatus: false,

  posts: [],
  hasMorePosts: true,
  nextCursor: null,
  isLoadingPosts: false,
  isFetchingMore: false,

  fetchProfile: async (username: string) => {
    set({ isLoadingProfile: true });
    try {
      const res = await api.get(`/users/${username}`);
      set({ profileUser: res.data.data });
    } catch {
      set({ profileUser: null });
    } finally {
      set({ isLoadingProfile: false });
    }
  },

  fetchFriendshipStatus: async (userId: string) => {
    if (!userId) return;
    set({ isLoadingStatus: true });
    try {
        const res = await api.get(`/friends/status/${userId}`);
        set({ friendshipStatus: res.data.data });
    } catch {
        set({ friendshipStatus: null });
    } finally {
        set({ isLoadingStatus: false });
    }
    },

  fetchPosts: async (userId: string, reset = false) => {
    set({ isLoadingPosts: true });
    try {
      const res = await api.get(`/posts/user/${userId}`, {
        params: { limit: 15 },
      });
      const { items, nextCursor } = res.data;

      set({
        posts: reset ? items : [...get().posts, ...items],
        nextCursor,
        hasMorePosts: !!nextCursor,
      });
    } finally {
      set({ isLoadingPosts: false });
    }
  },

  fetchMorePosts: async (userId: string) => {
    const { nextCursor, isFetchingMore, hasMorePosts } = get();
    if (!hasMorePosts || isFetchingMore || !nextCursor) return;

    set({ isFetchingMore: true });
    try {
      const res = await api.get(`/posts/user/${userId}`, {
        params: { cursor: nextCursor, limit: 15 },
      });
      const { items, nextCursor: newCursor } = res.data;

      set((state) => ({
        posts: [...state.posts, ...items],
        nextCursor: newCursor,
        hasMorePosts: !!newCursor,
      }));
    } finally {
      set({ isFetchingMore: false });
    }
  },

  reset: () => {
    set({
      profileUser: null,
      friendshipStatus: null,
      posts: [],
      nextCursor: null,
      hasMorePosts: true,
    });
  },
}));