import cloudinary from "../config/cloudinary";

/**
 * Upload nhiều file (image/video)
 */
export async function uploadMedias(
  files: Express.Multer.File[]
) {
  if (!files?.length) return [];

  const results = await Promise.all(
    files.map(async (file) => {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64"
      )}`;

      const isVideo = file.mimetype.startsWith("video/");

      const res = await cloudinary.uploader.upload(base64, {
        folder: "TravelSocial/posts",
        resource_type: isVideo ? "video" : "image",
        transformation: isVideo
          ? undefined
          : [
              { width: 1200, height: 1200, crop: "limit" },
              { quality: "auto" },
              { format: "auto" },
            ],
      });

      return {
        url: res.secure_url,
        type: isVideo ? "VIDEO" : "IMAGE",
        publicId: res.public_id,
      };
    })
  );

  return results;
}

export async function syncPostMedias(
  oldMediaUrls: string[],
  keepMediaUrls: string[] | undefined,
  files: Express.Multer.File[]
) {

  const safeKeepMediaUrls = keepMediaUrls ?? [];
  // 1. nếu frontend không gửi keepMedia → giữ toàn bộ media cũ
  const baseMedia =
    safeKeepMediaUrls.length > 0
      ? safeKeepMediaUrls
      : oldMediaUrls;

  // 2. upload file mới
  const uploaded = await uploadMedias(files || []);

  const uploadedUrls = uploaded.map((m) => m.url);

  // 3. merge
  const merged = [...baseMedia, ...uploadedUrls];

  // 4. remove duplicate
  return Array.from(new Set(merged));
}

export function extractPublicId(url: string) {
  const parts = url.split("/");

  const uploadIndex = parts.findIndex(
    (p) => p === "upload"
  );

  const publicIdWithExt = parts
    .slice(uploadIndex + 2)
    .join("/");

  return publicIdWithExt.replace(/\.[^/.]+$/, "");
}

export async function deleteMedias(urls: string[]) {
  if (!urls?.length) return;

  await Promise.all(
    urls.map(async (url) => {
      try {
        const publicId = extractPublicId(url);

        const isVideo = url.includes("/video/upload/");

        await cloudinary.uploader.destroy(publicId, {
          resource_type: isVideo ? "video" : "image",
        });
      } catch (err) {
        console.error("Delete media error:", err);
      }
    })
  );
}