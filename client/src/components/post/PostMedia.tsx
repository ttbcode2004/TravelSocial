import { cn } from "../../utils";

interface Props {
  mediaUrls: string[];
}

export default function PostMedia({
  mediaUrls,
}: Props) {
  const renderMedia = (url: string) => {
    const isVideo =
      url.includes("/video/upload/") ||
      /\.(mp4|webm|ogg)$/i.test(url);

    if (isVideo) {
      return (
        <video
          src={url}
          controls
          className="w-full h-full object-cover"
        />
      );
    }

    return (
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    );
  };

  if (mediaUrls.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid gap-0.5 bg-bg-muted",
        mediaUrls.length === 1
          ? "grid-cols-1"
          : "grid-cols-2"
      )}
    >
      {mediaUrls
        .slice(0, 4)
        .map((url, i) => (
          <div
            key={i}
            className={cn(
              "relative bg-black",
              mediaUrls.length === 3 &&
                i === 0 &&
                "row-span-2"
            )}
          >
            <div className="aspect-square">
              {renderMedia(url)}
            </div>

            {i === 3 &&
              mediaUrls.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">
                    +{mediaUrls.length - 4}
                  </span>
                </div>
              )}
          </div>
        ))}
    </div>
  );
}