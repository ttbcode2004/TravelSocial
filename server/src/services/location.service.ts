import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { forbidden, notFound } from "../utils/errors";
import type {
  CreateLocationDto,
  UpdateLocationDto,
  AddPhotoDto,
  LocationSearchDto,
  NearbyDto,
} from "../types/location.type";

// ─── Selectors ────────────────────────────────────────────────

const userPreview = {
  id: true,
  username: true,
  avatarUrl: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

const locationSelect = {
  id: true,
  name: true,
  description: true,
  latitude: true,
  longitude: true,
  locationType: true,
  notes: true,
  coverImage: true,
  isPublic: true,
  visitedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: userPreview },
  tags: { select: { tag: true } },
  _count: { select: { favorites: true, photos: true } },
} satisfies Prisma.MapLocationSelect;

const photoSelect = {
  id: true,
  photoUrl: true,
  caption: true,
  createdAt: true,
  user: { select: userPreview },
} satisfies Prisma.LocationPhotoSelect;

// Format: flatten tags array + isFavorited by viewer
function formatLocation(loc: any, viewerId?: string, favoriteIds?: Set<string>) {
  const { tags, _count, ...rest } = loc;
  return {
    ...rest,
    tags: tags.map((t: any) => t.tag),
    favoritesCount: _count.favorites,
    photosCount: _count.photos,
    isFavorited: favoriteIds ? favoriteIds.has(loc.id) : undefined,
  };
}

// ─── Visibility guard ─────────────────────────────────────────
// Trả về điều kiện WHERE để chỉ lấy location mà viewer được phép xem

async function buildVisibilityFilter(
  viewerId?: string
): Promise<Prisma.MapLocationWhereInput> {
  if (!viewerId) return { isPublic: true };

  // Lấy friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  const friendIds = friendships.map((f) =>
    f.requesterId === viewerId ? f.addresseeId : f.requesterId
  );

  return {
    OR: [
      { isPublic: true },
      { userId: viewerId },               // own private locations
      { userId: { in: friendIds }, isPublic: true }, // friend public
    ],
  };
}

// ─── Haversine distance filter (approximate via bounding box + JS filter) ──

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Tính bounding box từ center + radius (nhanh hơn scan toàn bộ)
function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────

export async function createLocation(userId: string, dto: CreateLocationDto) {
  const location = await prisma.mapLocation.create({
    data: {
      userId,
      name: dto.name,
      description: dto.description ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationType: dto.locationType,
      notes: dto.notes ?? null,
      coverImage: dto.coverImage ?? null,
      isPublic: dto.isPublic,
      visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : null,
      tags: {
        create: dto.tags.map((tag) => ({ tag: tag.toLowerCase().trim() })),
      },
    },
    select: locationSelect,
  });

  return formatLocation(location);
}

export async function getLocation(locationId: string, viewerId?: string) {
  const visibilityFilter = await buildVisibilityFilter(viewerId);

  const location = await prisma.mapLocation.findFirst({
    where: { id: locationId, ...visibilityFilter },
    select: {
      ...locationSelect,
      photos: {
        select: photoSelect,
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!location) throw notFound("Địa điểm không tồn tại hoặc bạn không có quyền xem");

  // Check if viewer has favorited
  let isFavorited = false;
  if (viewerId) {
    const fav = await prisma.locationFavorite.findUnique({
      where: { userId_locationId: { userId: viewerId, locationId } },
    });
    isFavorited = !!fav;
  }

  const { tags, _count, ...rest } = location as any;
  return {
    ...rest,
    tags: tags.map((t: any) => t.tag),
    favoritesCount: _count.favorites,
    photosCount: _count.photos,
    isFavorited,
  };
}

export async function updateLocation(
  locationId: string,
  userId: string,
  dto: UpdateLocationDto
) {
  const location = await prisma.mapLocation.findUnique({ where: { id: locationId } });
  if (!location) throw notFound("Địa điểm không tồn tại");
  if (location.userId !== userId) throw forbidden("Bạn không có quyền chỉnh sửa địa điểm này");

  // Rebuild tags nếu có thay đổi
  if (dto.tags !== undefined) {
    await prisma.locationTag.deleteMany({ where: { locationId } });
  }

  const updated = await prisma.mapLocation.update({
    where: { id: locationId },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.locationType !== undefined && { locationType: dto.locationType }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
      ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      ...(dto.visitedAt !== undefined && {
        visitedAt: dto.visitedAt ? new Date(dto.visitedAt) : null,
      }),
      ...(dto.tags !== undefined && {
        tags: {
          create: dto.tags.map((tag) => ({ tag: tag.toLowerCase().trim() })),
        },
      }),
    },
    select: locationSelect,
  });

  return formatLocation(updated);
}

export async function deleteLocation(locationId: string, userId: string) {
  const location = await prisma.mapLocation.findUnique({ where: { id: locationId } });
  if (!location) throw notFound("Địa điểm không tồn tại");
  if (location.userId !== userId) throw forbidden("Bạn không có quyền xoá địa điểm này");

  await prisma.mapLocation.delete({ where: { id: locationId } });
  return { message: "Đã xoá địa điểm" };
}

// ─── SEARCH ───────────────────────────────────────────────────

export async function searchLocations(dto: LocationSearchDto, viewerId?: string) {
  const { q, locationType, tag, latMin, latMax, lngMin, lngMax,
          lat, lng, radiusKm, cursor, limit, userId, onlyFavorites } = dto;

  const visibilityFilter = await buildVisibilityFilter(viewerId);

  // Bounding box từ radius nếu có
  let bbox = { latMin, latMax, lngMin, lngMax };
  if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
    const box = boundingBox(lat, lng, radiusKm);
    bbox = box;
  }

  // Nếu onlyFavorites → chỉ lấy location viewer đã favorite
  let favoriteLocationIds: string[] | undefined;
  if (onlyFavorites && viewerId) {
    const favs = await prisma.locationFavorite.findMany({
      where: { userId: viewerId },
      select: { locationId: true },
    });
    favoriteLocationIds = favs.map((f) => f.locationId);
  }

  const where: Prisma.MapLocationWhereInput = {
    AND: [
      visibilityFilter,
      ...(userId ? [{ userId }] : []),
      ...(locationType ? [{ locationType }] : []),
      ...(q ? [{ name: { contains: q, mode: "insensitive" as const } }] : []),
      ...(tag ? [{ tags: { some: { tag: { equals: tag.toLowerCase() } } } }] : []),
      ...(bbox.latMin !== undefined ? [{ latitude: { gte: bbox.latMin } }] : []),
      ...(bbox.latMax !== undefined ? [{ latitude: { lte: bbox.latMax } }] : []),
      ...(bbox.lngMin !== undefined ? [{ longitude: { gte: bbox.lngMin } }] : []),
      ...(bbox.lngMax !== undefined ? [{ longitude: { lte: bbox.lngMax } }] : []),
      ...(favoriteLocationIds !== undefined
        ? [{ id: { in: favoriteLocationIds } }]
        : []),
    ],
  };

  const locations = await prisma.mapLocation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: locationSelect,
  });

  // Lấy favorites của viewer để đánh dấu isFavorited
  let favoriteIds = new Set<string>();
  if (viewerId) {
    const ids = favoriteLocationIds ?? (
      await prisma.locationFavorite.findMany({
        where: { userId: viewerId, locationId: { in: locations.map((l) => l.id) } },
        select: { locationId: true },
      })
    ).map((f) => f.locationId);
    favoriteIds = new Set(Array.isArray(ids) ? ids : ids);
  }

  // Nếu có radius search → tính distance và sort
  let items = locations.slice(0, limit).map((l) => {
    const formatted = formatLocation(l, viewerId, favoriteIds);
    if (lat !== undefined && lng !== undefined) {
      return {
        ...formatted,
        distanceKm: Math.round(haversineKm(lat, lng, l.latitude, l.longitude) * 10) / 10,
      };
    }
    return formatted;
  });

  // Filter chính xác theo radius (bounding box có thể rộng hơn)
  if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
    items = items.filter((l: any) => l.distanceKm <= radiusKm);
    items.sort((a: any, b: any) => a.distanceKm - b.distanceKm);
  }

  const hasNextPage = locations.length > limit;

  return {
    items,
    nextCursor: hasNextPage ? locations[limit - 1].id : null,
    hasNextPage,
    total: items.length,
  };
}

// ─── NEARBY ───────────────────────────────────────────────────

export async function getNearbyLocations(dto: NearbyDto, viewerId?: string) {
  const { lat, lng, radiusKm, locationType, limit } = dto;
  const box = boundingBox(lat, lng, radiusKm);
  const visibilityFilter = await buildVisibilityFilter(viewerId);

  const candidates = await prisma.mapLocation.findMany({
    where: {
      AND: [
        visibilityFilter,
        { latitude: { gte: box.latMin, lte: box.latMax } },
        { longitude: { gte: box.lngMin, lte: box.lngMax } },
        ...(locationType ? [{ locationType }] : []),
      ],
    },
    select: locationSelect,
    take: limit * 3, // lấy dư để filter sau
  });

  // Tính distance chính xác và sort
  const withDistance = candidates
    .map((loc) => ({
      ...formatLocation(loc),
      distanceKm: Math.round(haversineKm(lat, lng, loc.latitude, loc.longitude) * 10) / 10,
    }))
    .filter((l) => l.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return { items: withDistance, center: { lat, lng }, radiusKm };
}

// ─── MY MAP ───────────────────────────────────────────────────

export async function getMyMap(userId: string) {
  // Trả về tất cả locations của user để render trên bản đồ
  const locations = await prisma.mapLocation.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      locationType: true,
      coverImage: true,
      visitedAt: true,
      isPublic: true,
      tags: { select: { tag: true } },
    },
    orderBy: { visitedAt: "desc" },
  });

  const visited   = locations.filter((l) => l.locationType === "VISITED");
  const wishlist  = locations.filter((l) => l.locationType === "WISHLIST");

  return {
    visited:  visited.map((l) => ({ ...l, tags: l.tags.map((t) => t.tag) })),
    wishlist: wishlist.map((l) => ({ ...l, tags: l.tags.map((t) => t.tag) })),
    stats: {
      totalVisited: visited.length,
      totalWishlist: wishlist.length,
    },
  };
}

// ─── FAVORITES ────────────────────────────────────────────────

export async function toggleFavorite(locationId: string, userId: string) {
  const location = await prisma.mapLocation.findUnique({ where: { id: locationId } });
  if (!location || (!location.isPublic && location.userId !== userId)) {
    throw notFound("Địa điểm không tồn tại");
  }

  const existing = await prisma.locationFavorite.findUnique({
    where: { userId_locationId: { userId, locationId } },
  });

  if (existing) {
    await prisma.locationFavorite.delete({
      where: { userId_locationId: { userId, locationId } },
    });
    return { favorited: false, message: "Đã bỏ yêu thích" };
  }

  await prisma.locationFavorite.create({ data: { userId, locationId } });
  return { favorited: true, message: "Đã thêm vào yêu thích" };
}

export async function getMyFavorites(
  userId: string,
  cursor?: string,
  limit = 20
) {
  const favs = await prisma.locationFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      createdAt: true,
      location: { select: locationSelect },
    },
  });

  const hasNextPage = favs.length > limit;
  const items = hasNextPage ? favs.slice(0, limit) : favs;

  return {
    items: items.map((f) => ({
      favoriteId: f.id,
      favoritedAt: f.createdAt,
      location: formatLocation(f.location),
    })),
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

// ─── PHOTOS ───────────────────────────────────────────────────

export async function addPhoto(locationId: string, userId: string, dto: AddPhotoDto) {
  // Phải là owner hoặc location phải public
  const location = await prisma.mapLocation.findUnique({ where: { id: locationId } });
  if (!location) throw notFound("Địa điểm không tồn tại");
  if (!location.isPublic && location.userId !== userId) {
    throw forbidden("Không có quyền thêm ảnh vào địa điểm này");
  }

  const photo = await prisma.locationPhoto.create({
    data: {
      locationId,
      userId,
      photoUrl: dto.photoUrl,
      caption: dto.caption ?? null,
    },
    select: photoSelect,
  });

  return photo;
}

export async function getPhotos(locationId: string, cursor?: string, limit = 20) {
  const photos = await prisma.locationPhoto.findMany({
    where: { locationId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: photoSelect,
  });

  const hasNextPage = photos.length > limit;
  const items = hasNextPage ? photos.slice(0, limit) : photos;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function deletePhoto(photoId: string, userId: string) {
  const photo = await prisma.locationPhoto.findUnique({ where: { id: photoId } });
  if (!photo) throw notFound("Ảnh không tồn tại");

  // Chủ ảnh hoặc chủ địa điểm mới xoá được
  if (photo.userId !== userId) {
    const location = await prisma.mapLocation.findUnique({
      where: { id: photo.locationId },
    });
    if (location?.userId !== userId) {
      throw forbidden("Bạn không có quyền xoá ảnh này");
    }
  }

  await prisma.locationPhoto.delete({ where: { id: photoId } });
  return { message: "Đã xoá ảnh" };
}

// ─── TAGS ─────────────────────────────────────────────────────

export async function getPopularTags(limit = 30) {
  const tags = await prisma.locationTag.groupBy({
    by: ["tag"],
    _count: { tag: true },
    orderBy: { _count: { tag: "desc" } },
    take: limit,
  });

  return tags.map((t) => ({ tag: t.tag, count: t._count.tag }));
}