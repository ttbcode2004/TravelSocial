// types/user.type.ts
import { z } from "zod";

export const UpdateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().pipe(z.url()).nullable().optional(),
  coverUrl: z.string().pipe(z.url()).nullable().optional(),
});

export const SearchUsersSchema = z.object({
  q: z.string().min(1).max(100),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type SearchUsersDto = z.infer<typeof SearchUsersSchema>;