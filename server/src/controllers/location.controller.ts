import { asyncHandler } from "../utils/errors";
import {
  CreateLocationSchema,
  UpdateLocationSchema,
  AddPhotoSchema,
  LocationSearchSchema,
  NearbySchema,
  LocationIdParam,
  PhotoIdParam,
  UserIdParam,
} from "../types/location.type";
import * as LocationsService from "../services/location.service";

// ─── CRUD ─────────────────────────────────────────────────────

export const createLocation = asyncHandler(async (req, res) => {
  const dto = CreateLocationSchema.parse(req.body);
  const location = await LocationsService.createLocation(req.user!.sub, dto);
  res.status(201).json({ success: true, data: location });
});

export const getLocation = asyncHandler(async (req, res) => {
  const location = await LocationsService.getLocation(
    LocationIdParam.parse(req.params).locationId,
    req.user?.sub
  );
  res.json({ success: true, data: location });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const dto = UpdateLocationSchema.parse(req.body);
  const location = await LocationsService.updateLocation(
    LocationIdParam.parse(req.params).locationId,
    req.user!.sub,
    dto
  );
  res.json({ success: true, data: location });
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const result = await LocationsService.deleteLocation(
    LocationIdParam.parse(req.params).locationId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

// ─── Discovery ────────────────────────────────────────────────

export const searchLocations = asyncHandler(async (req, res) => {
  const dto = LocationSearchSchema.parse(req.query);
  const result = await LocationsService.searchLocations(dto, req.user?.sub);
  res.json({ success: true, ...result });
});

export const getNearby = asyncHandler(async (req, res) => {
  const dto = NearbySchema.parse(req.query);
  const result = await LocationsService.getNearbyLocations(dto, req.user?.sub);
  res.json({ success: true, ...result });
});

export const getPopularTags = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 30;
  const tags = await LocationsService.getPopularTags(limit);
  res.json({ success: true, data: tags });
});

// ─── My Map ───────────────────────────────────────────────────

export const getMyMap = asyncHandler(async (req, res) => {
  const result = await LocationsService.getMyMap(req.user!.sub);
  res.json({ success: true, data: result });
});

export const getUserMap = asyncHandler(async (req, res) => {
  // Xem bản đồ của user khác (chỉ public locations)
  const result = await LocationsService.searchLocations(
    { userId: UserIdParam.parse(req.params).userId, limit: 200, onlyFavorites: false },
    req.user?.sub
  );
  res.json({ success: true, data: result.items });
});

// ─── Favorites ────────────────────────────────────────────────

export const toggleFavorite = asyncHandler(async (req, res) => {
  const result = await LocationsService.toggleFavorite(
    LocationIdParam.parse(req.params).locationId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

export const getMyFavorites = asyncHandler(async (req, res) => {
  const cursor = req.query.cursor as string | undefined;
  const limit  = Number(req.query.limit) || 20;
  const result = await LocationsService.getMyFavorites(req.user!.sub, cursor, limit);
  res.json({ success: true, ...result });
});

// ─── Photos ───────────────────────────────────────────────────

export const addPhoto = asyncHandler(async (req, res) => {
  const dto = AddPhotoSchema.parse(req.body);
  const photo = await LocationsService.addPhoto(
    LocationIdParam.parse(req.params).locationId,
    req.user!.sub,
    dto
  );
  res.status(201).json({ success: true, data: photo });
});

export const getPhotos = asyncHandler(async (req, res) => {
  const cursor = req.query.cursor as string | undefined;
  const limit  = Number(req.query.limit) || 20;
  const result = await LocationsService.getPhotos(LocationIdParam.parse(req.params).locationId, cursor, limit);
  res.json({ success: true, ...result });
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const result = await LocationsService.deletePhoto(
    PhotoIdParam.parse(req.params).photoId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});