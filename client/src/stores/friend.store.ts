import { create } from "zustand";
import { api } from "../lib/api";
import { onSocket } from "../lib/socket";
import type {
  CursorPageDto,
  SearchDto,
  FriendshipStatusView,
  UserPreview,
} from "../types";

export interface FriendUser extends UserPreview {
  mutualFriendsCount?: number;
}

interface Friendship {
  id: string;
  status: FriendshipStatusView;
  createdAt?: string;
}

interface FriendStore {
  // State
  friends: FriendUser[];
  receivedRequests: any[];
  sentRequests: any[];
  blockedUsers: any[];
  suggestions: FriendUser[];

  friendsNextCursor: string | null;
  requestsNextCursor: string | null;
  blockedNextCursor: string | null;

  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingBlocked: boolean;
  isLoadingSuggestions: boolean;

  // Actions
  fetchFriends: (reset?: boolean, dto?: SearchDto) => Promise<void>;
  fetchReceivedRequests: (reset?: boolean) => Promise<void>;
  fetchSentRequests: (reset?: boolean) => Promise<void>;
  fetchBlockedUsers: (reset?: boolean) => Promise<void>;
  fetchSuggestions: () => Promise<void>;

  sendRequest: (targetUserId: string) => Promise<void>;
  acceptRequest: (friendshipId: string) => Promise<void>;
  declineRequest: (friendshipId: string) => Promise<void>;
  cancelRequest: (friendshipId: string) => Promise<void>;
  unfriend: (targetUserId: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;

  getFriendshipStatus: (targetUserId: string) => Promise<Friendship>;

  // Socket
  initSocketListeners: () => () => void;

  // Helpers
  removeFromAllLists: (userId: string) => void;
}

export const useFriendStore = create<FriendStore>((set, get) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  blockedUsers: [],
  suggestions: [],

  friendsNextCursor: null,
  requestsNextCursor: null,
  blockedNextCursor: null,

  isLoadingFriends: false,
  isLoadingRequests: false,
  isLoadingBlocked: false,
  isLoadingSuggestions: false,

  // ====================== FETCH ======================

  fetchFriends: async (reset = false, dto: SearchDto = {}) => {
    set({ isLoadingFriends: true });
    try {
      const res = await api.get("/friends/list", { params: dto });
      const { items, nextCursor } = res.data;

      set((state) => ({
        friends: reset ? items : [...state.friends, ...items],
        friendsNextCursor: nextCursor,
      }));
    } finally {
      set({ isLoadingFriends: false });
    }
  },

  fetchReceivedRequests: async (reset = false) => {
    set({ isLoadingRequests: true });
    try {
      const res = await api.get("/friends/requests/received");
      const { items, nextCursor } = res.data;

      set((state) => ({
        receivedRequests: reset ? items : [...state.receivedRequests, ...items],
        requestsNextCursor: nextCursor,
      }));
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  fetchSentRequests: async (reset = false) => {
    set({ isLoadingRequests: true });
    try {
      const res = await api.get("/friends/requests/sent");
      const { items, nextCursor } = res.data;

      set((state) => ({
        sentRequests: reset ? items : [...state.sentRequests, ...items],
        requestsNextCursor: nextCursor,
      }));
    } finally {
      set({ isLoadingRequests: false });
    }
  },

  fetchBlockedUsers: async (reset = false) => {
    set({ isLoadingBlocked: true });
    try {
      const res = await api.get("/friends/blocked");
      const { items, nextCursor } = res.data;

      set((state) => ({
        blockedUsers: reset ? items : [...state.blockedUsers, ...items],
        blockedNextCursor: nextCursor,
      }));
    } finally {
      set({ isLoadingBlocked: false });
    }
  },

  fetchSuggestions: async () => {
    set({ isLoadingSuggestions: true });
    try {
      const res = await api.get("/friends/suggestions");
      set({ suggestions: res.data.items || [] });
    } finally {
      set({ isLoadingSuggestions: false });
    }
  },

  // ====================== ACTIONS ======================

  sendRequest: async (targetUserId: string) => {
    await api.post(`/friends/${targetUserId}`);
    // Refresh lists
    get().fetchSentRequests(true);
    get().fetchSuggestions();
  },

  acceptRequest: async (friendshipId: string) => {
    await api.patch(`/friends/requests/accept/${friendshipId}`);
    get().fetchReceivedRequests(true);
    get().fetchFriends(true);
  },

  declineRequest: async (friendshipId: string) => {
    await api.patch(`/friends/requests/decline/${friendshipId}`);
    get().fetchReceivedRequests(true);
  },

  cancelRequest: async (friendshipId: string) => {
    await api.delete(`/friends/requests/${friendshipId}`);
    get().fetchSentRequests(true);
  },

  unfriend: async (targetUserId: string) => {
    await api.delete(`/friends/${targetUserId}`);
    get().removeFromAllLists(targetUserId);
    get().fetchFriends(true);
  },

  blockUser: async (targetUserId: string) => {
    await api.post(`/friends/block/${targetUserId}`);
    get().removeFromAllLists(targetUserId);
    get().fetchBlockedUsers(true);
  },

  unblockUser: async (targetUserId: string) => {
    await api.delete(`/friends/block/${targetUserId}`);
    get().fetchBlockedUsers(true);
  },

  getFriendshipStatus: async (targetUserId: string) => {
    const res = await api.get(`/friends/status/${targetUserId}`);
    return res.data.data;
  },

  // ====================== SOCKET ======================

  initSocketListeners: () => {
    const offFriendRequest = onSocket<any>("notification:new", (notif) => {
      if (notif.type === "FRIEND_REQUEST") {
        get().fetchReceivedRequests(true);
      }
      if (notif.type === "FRIEND_ACCEPTED") {
        get().fetchFriends(true);
        get().fetchSentRequests(true);
      }
    });

    return () => {
      offFriendRequest();
    };
  },

  // ====================== HELPER ======================

  removeFromAllLists: (userId: string) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== userId),
      receivedRequests: state.receivedRequests.filter((r) => r.requester?.id !== userId),
      sentRequests: state.sentRequests.filter((r) => r.addressee?.id !== userId),
      suggestions: state.suggestions.filter((s) => s.id !== userId),
    }));
  },
}));