import { useRef, useState } from "react";
import {Globe, Users, Lock, ImagePlus, Video, X } from "lucide-react";
import { cn } from "../../utils";
import { useUser } from "../../stores/auth.store";
import { usePostStore } from "../../stores/post.store";
import Avatar, {Spinner} from "../../components/ui/Avatar";
import toast from "react-hot-toast";
import type { Visibility } from "../../types";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  icon: typeof Globe;
  label: string;
}[] = [
  {
    value: "PUBLIC", icon: Globe, label: "Công khai",
  },
  {
    value: "FRIENDS",  icon: Users, label: "Bạn bè",
  },
  {
    value: "PRIVATE", icon: Lock, label: "Chỉ mình tôi",
  },
];

export default function CreatePost() {
  const user = useUser();
  const createPost = usePostStore((s) => s.createPost);
  const isLoading = usePostStore((s) => s.isLoading);

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [expanded, setExpanded] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef =useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);

    if (!selected.length) return;

    setFiles((prev) => [...prev, ...selected ].slice(0, 10));

    setExpanded(true);
  };

  const removeFile = (index: number) => {
    setFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const submit = async ( e: any) => {
    e.preventDefault();

    if (!content.trim()) {
      toast("Nội dung không được để trống");
      return;
    }

    const success = await createPost({
      content: content.trim(),
      visibility,
      media: files,
    });

    if (success) {
      setContent("");
      setFiles([]);
      setExpanded(false);

      toast.success("Đã đăng bài");
    } else {
      toast.error("Không thể đăng bài");
    }
  };

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="flex gap-3">
        <Avatar
          src={user.avatarUrl}
          name={user.username}
          size="md"
        />

        <div className="flex-1">
          {/* Input */}
          <textarea
            className={cn(
              "w-full bg-bg-muted rounded-sm px-4 py-3 text-base text-fg",
              "placeholder:text-fg-subtle resize-none focus:outline-none",
              "focus:ring-2 focus:ring-primary/30 transition-all duration-200",
              expanded
                ? "min-h-[100px]"
                : "min-h-[44px]"
            )}
            placeholder={`${user.username} ơi, bạn đang nghĩ gì vậy?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
          />

          {/* Preview media */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);

                const isVideo = file.type.startsWith("video");

                return (
                  <div
                    key={index}
                    className="relative rounded-sm overflow-hidden border border-border bg-bg-muted"
                  >
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="cursor-pointer absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                    >
                      <X size={14} />
                    </button>

                    {isVideo ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-52 object-cover"
                      />
                    ) : (
                      <img
                        src={url}
                        alt=""
                        className="w-full h-52 object-cover"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          {expanded && (
            <div className="flex flex-col gap-3 mt-3 animate-fade-in">
              {/* Visibility */}
              <div className="flex flex-wrap items-center gap-2">
                {VISIBILITY_OPTIONS.map(
                  ({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVisibility(value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs md:text-sm transition-all cursor-pointer",
                        visibility === value
                          ? "bg-primary-subtle text-primary font-medium"
                          : "text-fg-muted hover:bg-bg-muted"
                      )}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  )
                )}
              </div>

              {/* Bottom */}
              <div className="flex items-center justify-between">
                {/* Upload */}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    hidden
                    onChange={handleFiles}
                  />

                  <button
                    type="button"
                    className="btn-ghost py-2 px-3 text-base"
                    onClick={() => inputRef.current?.click()}
                  >
                    <ImagePlus size={20} />
                  </button>

                  <button
                    type="button"
                    className="btn-ghost py-2 px-3 text-base"
                    onClick={() => inputRef.current?.click() }
                  >
                    <Video size={20} />
                  </button>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-ghost py-1.5 px-3 text-sm"
                    onClick={() => {
                      setExpanded(false);
                      setContent("");
                      setFiles([]);
                    }}
                  >
                    <X size={20} />
                  </button>

                  <button
                    type="submit"
                    className="btn-primary py-1.5 px-4 text-base"
                    disabled={
                      (!content.trim() &&
                        files.length === 0) ||
                      isLoading
                    }
                  >
                    {isLoading ? (
                      <Spinner className="w-3 h-3" />
                    ) : (
                      "Đăng"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}