// controllers/user.controller.ts
import { asyncHandler } from "../utils/errors";
import * as UserService from "../services/user.service";
import { UpdateProfileSchema, SearchUsersSchema } from "../types/user.type";

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await UserService.getUserByUsername(req.user!.username);
  res.json({ success: true, data: user });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const username = req.params.username as string;
    
  const user = await UserService.getUserProfile(username);
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const dto = UpdateProfileSchema.parse(req.body);

  const updatedUser = await UserService.updateProfile(req.user!.sub, dto);

  res.json({
    success: true,
    message: "Cập nhật hồ sơ thành công",
    data: updatedUser,
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const dto = SearchUsersSchema.parse(req.query);
  const result = await UserService.searchUsers(dto, req.user?.sub);

  res.json({ success: true, ...result });
});