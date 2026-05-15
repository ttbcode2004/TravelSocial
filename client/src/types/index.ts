// ─── Enums ────────────────────────────────────────────────────

export type Visibility       = "PUBLIC" | "FRIENDS" | "PRIVATE";
export type ReactionType     = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
export type MessageType      = "TEXT" | "IMAGE" | "VIDEO" | "FILE" | "LOCATION";
export type ConversationType = "PRIVATE" | "GROUP";
export type MemberRole       = "ADMIN" | "MEMBER";
export type LocationType     = "VISITED" | "WISHLIST";
export type PlanStatus       = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PlanMemberRole   = "OWNER" | "EDITOR" | "VIEWER";
export type TaskStatus       = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
export type TaskPriority     = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ExpenseCategory  = "TRANSPORT" | "ACCOMMODATION" | "FOOD" | "ACTIVITY" | "SHOPPING" | "OTHER";
export type NotificationType =
  | "REACTION" | "COMMENT" | "COMMENT_REPLY" | "POST_SHARE"
  | "FRIEND_REQUEST" | "FRIEND_ACCEPTED"
  | "NEW_MESSAGE"
  | "PLAN_INVITE" | "PLAN_UPDATE" | "TASK_ASSIGNED" | "TASK_DONE"
  | "LOCATION_SAVED";

// ─── Friendship Types ─────────────────────────────────────────

/** Trạng thái quan hệ bạn bè từ góc nhìn của người xem */
export type FriendshipStatusView =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "ACCEPTED"
  | "BLOCKED"
  | "BLOCKED_BY";

// ─── DTOs ─────────────────────────────────────────────────────

export interface CursorPageDto {
  cursor?: string;
  limit?: number;
}

export interface SearchDto {
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface UserIdDto {
  userId: string;
}

export interface FriendshipIdDto {
  friendshipId: string;
}
// ─── User ─────────────────────────────────────────────────────

export interface User {
  sub: string;
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  isVerified: boolean;
  provider: string;
  createdAt: string;
}

export interface UserPreview {
  id: string;
  username: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

// ─── Friendship Response ──────────────────────────────────────

export interface Friendship {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  requester?: UserPreview;
  addressee?: UserPreview;
}

// ─── Post ─────────────────────────────────────────────────────

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  user: UserPreview;
  counts: { reactions: number; comments: number; shares: number };
  viewerReaction: ReactionType | null;
}

export interface Comment {
  id: string;

  content: string;

  parentId: string | null;

  createdAt: string;

  updatedAt: string;

  user: User;

  replies?: Comment[];

  _count?: {
    replies: number;
  };
}

export interface PlanMessage {
  id: string;

  content?: string;

  mediaUrl?: string;

  createdAt: string;

  updatedAt: string;

  user: {
    id: string;

    username: string;

    avatarUrl?: string | null;
  };
}

// ─── Friendship ───────────────────────────────────────────────

export interface Friendship {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  requester?: UserPreview;
  addressee?: UserPreview;
}

export interface FriendUser extends UserPreview {
  mutualFriendsCount?: number;
}

// ─── Pagination ───────────────────────────────────────────────

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

// ─── Conversation & Message ───────────────────────────────────

export interface ConversationMember {
  id: string;
  role: MemberRole;
  joinedAt: string;
  lastReadAt: string | null;
  user: UserPreview;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  members: ConversationMember[];
  lastMessage: Message | null;
  lastReadAt: string | null;
}

export interface Message {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  type: MessageType;
  isDeleted: boolean;
  createdAt: string;
  sender: UserPreview;
}

// ─── Location ─────────────────────────────────────────────────

export interface MapLocation {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  locationType: LocationType;
  notes: string | null;
  coverImage: string | null;
  isPublic: boolean;
  visitedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserPreview;
  tags: string[];
  favoritesCount: number;
  photosCount: number;
  isFavorited?: boolean;
  distanceKm?: number;
}

// ─── Plan ─────────────────────────────────────────────────────

export interface Plan {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  totalBudget: number | null;
  currency: string;
  status: PlanStatus;
  coverImage: string | null;
  createdAt: string;
  creator: UserPreview;
  members?: PlanMember[];
  tasks?: Task[];
  expenses?: Expense[];
  totalSpent?: number;
  _count: { members: number; tasks: number; expenses: number };
}

export interface PlanMember {
  id: string;
  role: PlanMemberRole;
  joinedAt: string;
  user: UserPreview;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  assignee: UserPreview | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expenseDate: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
  paidBy: UserPreview;
}

// ─── Notification ─────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  entityId: string | null;
  entityType: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  actor: UserPreview | null;
}

// ─── Pagination ───────────────────────────────────────────────

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}