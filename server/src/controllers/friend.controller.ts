import { asyncHandler } from "../utils/errors";
import { CursorPageSchema, FriendshipIdParam, SearchSchema, UserIdParam } from "../types/friend.type";
import * as FriendsService from "../services/friend.service";

export const sendRequest = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);

  const result = await FriendsService.sendRequest(
    req.user!.sub,
    userId
  );

  res.status(201).json({ success: true, ...result });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const { friendshipId } = FriendshipIdParam.parse(req.params);

  const result = await FriendsService.acceptRequest(
    req.user!.sub,
    friendshipId
  );

  res.json({ success: true, ...result });
});

export const declineRequest = asyncHandler(async (req, res) => {
  const { friendshipId } = FriendshipIdParam.parse(req.params);

  const result = await FriendsService.declineRequest(
    req.user!.sub,
    friendshipId
  );

  res.json({ success: true, ...result });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const { friendshipId } = FriendshipIdParam.parse(req.params);

  const result = await FriendsService.cancelRequest(
    req.user!.sub,
    friendshipId
  );

  res.json({ success: true, ...result });
});

// ─── Friendship ───────────────────────────────────────────────

export const unfriend = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);

  const result = await FriendsService.unfriend(
    req.user!.sub,
    userId
  );

  res.json({ success: true, ...result });
});

export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);

  const result = await FriendsService.blockUser(
    req.user!.sub,
    userId
  );

  res.json({ success: true, ...result });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);

  const result = await FriendsService.unblockUser(
    req.user!.sub,
    userId
  );

  res.json({ success: true, ...result });
});

// ─── Lists ────────────────────────────────────────────────────

export const getFriends = asyncHandler(async (req, res) => {
  const dto = SearchSchema.parse(req.query);

  // optional param
  const parsed = UserIdParam.safeParse(req.params);
  const targetUserId = parsed.success
    ? parsed.data.userId
    : req.user!.sub;

  const result = await FriendsService.getFriends(targetUserId, dto);

  res.json({ success: true, ...result });
});

export const getReceivedRequests = asyncHandler(async (req, res) => {
  const dto = CursorPageSchema.parse(req.query);

  const result = await FriendsService.getReceivedRequests(
    req.user!.sub,
    dto
  );

  res.json({ success: true, ...result });
});

export const getSentRequests = asyncHandler(async (req, res) => {
  const dto = CursorPageSchema.parse(req.query);

  const result = await FriendsService.getSentRequests(
    req.user!.sub,
    dto
  );

  res.json({ success: true, ...result });
});

export const getBlockedUsers = asyncHandler(async (req, res) => {
  const dto = CursorPageSchema.parse(req.query);

  const result = await FriendsService.getBlockedUsers(
    req.user!.sub,
    dto
  );

  res.json({ success: true, ...result });
});

// ─── Status & Mutual ──────────────────────────────────────────

export const getFriendshipStatus = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);

  const result = await FriendsService.getFriendshipStatus(
    req.user!.sub,
    userId
  );

  res.json({ success: true, data: result });
});

export const getMutualFriends = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);
  const dto = CursorPageSchema.parse(req.query);

  const result = await FriendsService.getMutualFriends(
    req.user!.sub,
    userId,
    dto
  );

  res.json({ success: true, ...result });
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 20;

  const items = await FriendsService.getFriendSuggestions(
    req.user!.sub,
    limit
  );

  res.json({ success: true, items });
});