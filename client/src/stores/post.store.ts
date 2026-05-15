import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "../lib/api";

import type { Post, CursorPage, ReactionType, Comment, Visibility } from "../types";

interface CreatePostData {
  content?: string;
  visibility?: Visibility;
  media?: File[];
}

interface UpdatePostData {
  content?: string;
  visibility?: Visibility;
  keepMediaUrls?: string[];
  media?: File[];
}

interface PostStore {
  // ─── State ─────────────────────────────────────
  feed: CursorPage<Post> | null;
  currentPost: Post | null;
  comments: CursorPage<Comment> | null;
  isLoading: boolean;

  getFeed: (cursor?: string) => Promise<void>;
  getPost: (postId: string) => Promise<void>;

  createPost: (
    data: CreatePostData
  ) => Promise<boolean>;

  updatePost: (
    postId: string,
    data: UpdatePostData
  ) => Promise<boolean>;

  deletePost: (
    postId: string
  ) => Promise<boolean>;

  // ─── Reactions ─────────────────────────────────
  reactPost: (
    postId: string,
    type: ReactionType
  ) => Promise<void>;

  removeReaction: (
    postId: string
  ) => Promise<void>;

  // ─── Comments ──────────────────────────────────
  getComments: (
    postId: string,
    cursor?: string
  ) => Promise<void>;

  createComment: (
    postId: string,
    content: string,
    parentId?: string
  ) => Promise<boolean>;

  // ─── Share ─────────────────────────────────────
  sharePost: (
    postId: string,
    note?: string
  ) => Promise<boolean>;

  // ─── Utils ─────────────────────────────────────
  reset: () => void;
}

export const usePostStore = create<PostStore>()(
  persist(
    (set, get) => ({
      // ─── Initial state ──────────────────────────
      feed: null,
      currentPost: null,
      comments: null,
      isLoading: false,

      // ─── Feed ───────────────────────────────────
      getFeed: async (cursor) => {
        try {
          set({ isLoading: true });

          const res = await api.get("/posts/feed", {
              params: {
                cursor,
                limit: 10,
              },
            }
          );

          const data: CursorPage<Post> = res.data;

          set((state) => ({
            feed:
              cursor && state.feed
                ? {
                    ...data,
                    items: [
                      ...state.feed.items,
                      ...data.items,
                    ],
                  }
                : data,
          }));
        } catch (error) {
          console.error("Get feed failed", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Get single post ────────────────────────
      getPost: async (postId) => {
        try {
          set({ isLoading: true });

          const res = await api.get(`/posts/${postId}`);

          set({ currentPost: res.data.data });
        } catch (error) {
          console.error("Get post failed", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Create post ────────────────────────────
      createPost: async (data) => {
        try {
          set({ isLoading: true });

          const formData = new FormData();

          if (data.content) {
            formData.append("content", data.content);
          }

          if (data.visibility) {
            formData.append("visibility", data.visibility);
          }

          data.media?.forEach((file) => {
            formData.append("mediaUrls", file);
          });

          const res = await api.post(
            "/posts", formData, {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

          const newPost: Post = res.data.data;
          
          set((state) => ({
            feed: state.feed
              ? {
                  ...state.feed,
                  items: [
                    newPost,
                    ...state.feed.items,
                  ],
                }
              : {
                  items: [newPost],
                  nextCursor: null,
                  hasNextPage: false,
                },
          }));

          return true;
        } catch (error) {
          console.error("Create post failed", error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Update post ────────────────────────────
      updatePost: async (postId, data) => {
        try {
          set({ isLoading: true });

          const formData = new FormData();

          if (data.content !== undefined) {
            formData.append(
              "content",
              data.content
            );
          }

          if (data.visibility) {
            formData.append(
              "visibility",
              data.visibility
            );
          }

          data.keepMediaUrls?.forEach(
            (url) => {
              formData.append(
                "keepMediaUrls",
                url
              );
            }
          );

          data.media?.forEach((file) => {
            formData.append("media", file);
          });

          const res = await api.patch(
            `/posts/${postId}`,
            formData,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

          const updatedPost: Post = res.data;

          set((state) => ({
            feed: state.feed
              ? {
                  ...state.feed,
                  items:
                    state.feed.items.map(
                      (post) =>
                        post.id === postId
                          ? updatedPost
                          : post
                    ),
                }
              : null,

            currentPost:
              state.currentPost?.id ===
              postId
                ? updatedPost
                : state.currentPost,
          }));

          return true;
        } catch (error) {
          console.error("Update post failed", error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Delete post ────────────────────────────
      deletePost: async (postId) => {
        try {
          set({ isLoading: true });

          await api.delete(`/posts/${postId}`);

          set((state) => ({
            feed: state.feed
              ? {
                  ...state.feed,
                  items:
                    state.feed.items.filter(
                      (post) =>
                        post.id !== postId
                    ),
                }
              : null,

            currentPost:
              state.currentPost?.id ===
              postId
                ? null
                : state.currentPost,
          }));

          return true;
        } catch (error) {
          console.error("Delete post failed", error);

          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // ─── Reactions ──────────────────────────────
      reactPost: async (
        postId,
        type
      ) => {
        try {
          const res = await api.post(
            `/posts/${postId}/reactions`,
            {
              type,
            }
          );

          const counts =
            res.data.data.counts;

          set((state) => ({
            feed: state.feed
              ? {
                  ...state.feed,
                  items:
                    state.feed.items.map(
                      (post) =>
                        post.id === postId
                          ? {
                              ...post,
                              counts: {
                                ...post.counts,
                                reactions:
                                  Object.values(
                                    counts
                                  ).reduce(
                                    (
                                      a: number,
                                      b: any
                                    ) =>
                                      a +
                                      Number(
                                        b
                                      ),
                                    0
                                  ),
                              },
                              viewerReaction:
                                type,
                            }
                          : post
                    ),
                }
              : null,
          }));
        } catch (error) {
          console.error("React failed", error);
        }
      },

      removeReaction: async (
        postId
      ) => {
        try {
          const res = await api.delete(
            `/posts/${postId}/reactions`
          );

          const counts =
            res.data.data.counts;

          set((state) => ({
            feed: state.feed
              ? {
                  ...state.feed,
                  items:
                    state.feed.items.map(
                      (post) =>
                        post.id === postId
                          ? {
                              ...post,
                              counts: {
                                ...post.counts,
                                reactions:
                                  Object.values(
                                    counts
                                  ).reduce(
                                    (
                                      a: number,
                                      b: any
                                    ) =>
                                      a +
                                      Number(
                                        b
                                      ),
                                    0
                                  ),
                              },
                              viewerReaction:
                                null,
                            }
                          : post
                    ),
                }
              : null,
          }));
        } catch (error) {
          console.error("Remove reaction failed", error);
        }
      },

      // ─── Comments ───────────────────────────────
      getComments: async (
        postId,
        cursor
      ) => {
        try {
          const res = await api.get(
            `/posts/comments/${postId}`,
            {
              params: {
                cursor,
                limit: 10,
              },
            }
          );

          const data: CursorPage<Comment> =
            res.data;

          set((state) => ({
            comments:
              cursor &&
              state.comments
                ? {
                    ...data,
                    items: [
                      ...state.comments
                        .items,
                      ...data.items,
                    ],
                  }
                : data,
          }));
        } catch (error) {
          console.error("Get comments failed", error);
        }
      },

   createComment: async (
  postId,
  content,
  parentId
) => {
  try {
    const res = await api.post(
      `/posts/comments/${postId}`,
      {
        content,
        parentId,
      }
    );

    const comment: Comment = res.data;

    set((state) => {
      if (!state.comments) {
        return {
          comments: {
            items: [comment],
            nextCursor: null,
            hasNextPage: false,
          },
        };
      }

      // reply
      if (parentId) {
        return {
          comments: {
            ...state.comments,
            items: state.comments.items.map(
              (item) => {
                if (item.id !== parentId)
                  return item;

                return {
                  ...item,
                  replies: [
                    ...(item.replies || []),
                    comment,
                  ],
                };
              }
            ),
          },
        };
      }

      // comment thường
      return {
        comments: {
          ...state.comments,
          items: [
            ...state.comments.items,
            {
              ...comment,
              replies: [],
            },
          ],
        },
      };
    });

    return true;
  } catch (error) {
    console.error("Create comment failed", error);

    return false;
  }
},

      // ─── Share ──────────────────────────────────
      sharePost: async (
        postId,
        note
      ) => {
        try {
          await api.post(
            `/posts/${postId}/share`,
            {
              note,
            }
          );

          set((state) => ({
            feed: state.feed
              ? {
                  ...state.feed,
                  items:
                    state.feed.items.map(
                      (post) =>
                        post.id === postId
                          ? {
                              ...post,
                              counts: {
                                ...post.counts,
                                shares:
                                  post.counts
                                    .shares +
                                  1,
                              },
                            }
                          : post
                    ),
                }
              : null,
          }));

          return true;
        } catch (error) {
          console.error("Share failed", error);

          return false;
        }
      },

      // ─── Reset ──────────────────────────────────
      reset: () => {
        set({
          feed: null,
          currentPost: null,
          comments: null,
          isLoading: false,
        });
      },
    }),
    {
      name: "post-storage",

      partialize: () => ({}),
    }
  )
);