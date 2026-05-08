import { z } from "zod";
import { LocationType } from "../generated/prisma/client";

// ─── Location ─────────────────────────────────────────────────

export const CreateLocationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationType: z.enum(LocationType),
  notes: z.string().max(2000).optional(),
  coverImage: z.string().pipe(z.url()).optional(),
  isPublic: z.boolean().default(true),
  visitedAt: z.iso.datetime().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
});

export const UpdateLocationSchema = CreateLocationSchema.partial();

// ─── Photos ───────────────────────────────────────────────────

export const AddPhotoSchema = z.object({
  photoUrl: z.string().pipe(z.url()),
  caption: z.string().max(500).optional(),
});

// ─── Search / Filter ──────────────────────────────────────────

export const LocationSearchSchema = z.object({
  q: z.string().max(200).optional(),
  locationType: z.enum(LocationType).optional(),
  tag: z.string().max(50).optional(),
  // Bounding box search
  latMin: z.coerce.number().min(-90).max(90).optional(),
  latMax: z.coerce.number().min(-90).max(90).optional(),
  lngMin: z.coerce.number().min(-180).max(180).optional(),
  lngMax: z.coerce.number().min(-180).max(180).optional(),
  // Radius search (km)
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.1).max(500).optional(),
  // Pagination
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  // Owner filter
  userId: z.string().pipe(z.uuid()).optional(),
  onlyFavorites: z.coerce.boolean().default(false),
});

export const NearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(200).default(10),
  locationType: z.enum(LocationType).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const LocationIdParam = z.object({
  locationId: z.string().pipe(z.uuid()),
});

export const PhotoIdParam = z.object({
  photoId: z.string().pipe(z.uuid()),
});

export const UserIdParam = z.object({
  userId: z.string().pipe(z.uuid()),
});

// ─── Types ────────────────────────────────────────────────────

export type CreateLocationDto   = z.infer<typeof CreateLocationSchema>;
export type UpdateLocationDto   = z.infer<typeof UpdateLocationSchema>;
export type AddPhotoDto         = z.infer<typeof AddPhotoSchema>;
export type LocationSearchDto   = z.infer<typeof LocationSearchSchema>;
export type NearbyDto           = z.infer<typeof NearbySchema>;
export type LocationIdParamDto   = z.infer<typeof LocationIdParam>;
export type PhotoIdParamDto      = z.infer<typeof PhotoIdParam>;
export type UserIdParamDto       = z.infer<typeof UserIdParam>;