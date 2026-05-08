import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware";
import * as LocationsController from "../controllers/location.controller";

const router = Router();

// ─── Discovery (public) ───────────────────────────────────────
//Tìm kiếm theo tên, tag, bounding box, radius
router.get("/search", optionalAuthenticate, LocationsController.searchLocations);

// Địa điểm gần vị trí hiện tại
router.get("/nearby", optionalAuthenticate, LocationsController.getNearby);

// Tag phổ biến
router.get("/tags", LocationsController.getPopularTags);

// ─── My Map ───────────────────────────────────────────────────
// Toàn bộ visited + wishlist của tôi (cho map view)
router.get("/my-map", authenticate, LocationsController.getMyMap);

//  Locations tôi đã yêu thích
router.get("/favorites", authenticate, LocationsController.getMyFavorites);

// ─── User map ─────────────────────────────────────────────────
// Bản đồ public của user khác
router.get("/user/:userId", optionalAuthenticate, LocationsController.getUserMap);

// ─── CRUD ─────────────────────────────────────────────────────
// Tạo địa điểm mới
router.post("/", authenticate, LocationsController.createLocation);

// Chi tiết địa điểm + photos
router.get("/:locationId", optionalAuthenticate, LocationsController.getLocation);

// Sửa địa điểm (owner)
router.patch("/:locationId", authenticate, LocationsController.updateLocation);

// Xoá địa điểm (owner)
router.delete("/:locationId", authenticate, LocationsController.deleteLocation);

// ─── Favorites ────────────────────────────────────────────────
// Toggle yêu thích
router.post("/:locationId/favorite", authenticate, LocationsController.toggleFavorite);

// ─── Photos ───────────────────────────────────────────────────
// Danh sách ảnh (cursor)
router.get("/:locationId/photos", optionalAuthenticate, LocationsController.getPhotos);

// Thêm ảnh
router.post("/:locationId/photos", authenticate, LocationsController.addPhoto);

// Xoá ảnh (chủ ảnh hoặc chủ địa điểm)
router.delete("/photos/:photoId", authenticate, LocationsController.deletePhoto);

export default router;