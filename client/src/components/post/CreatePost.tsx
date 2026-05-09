import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Users, Lock, Image, X } from "lucide-react";
import { api } from "../../lib/api";
import { cn } from "../../utils";
import { useUser } from "../../stores/auth.store";
import Avatar from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Avatar";
import toast from "react-hot-toast";
import type { Visibility } from "../../types";

const VISIBILITY_OPTIONS: { value: Visibility; icon: typeof Globe; label: string }[] = [
  { value: "PUBLIC", icon: Globe, label: "Công khai" },
  { value: "FRIENDS", icon: Users, label: "Bạn bè" },
  { value: "PRIVATE", icon: Lock, label: "Chỉ mình tôi" },
];

export default function CreatePost() {
  const user = useUser();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  if (!user) return null;

  const VOption = VISIBILITY_OPTIONS.find((o) => o.value === visibility)!;
  const VIcon = VOption.icon;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await api.post("/posts", { content: content.trim(), visibility });
      setContent("");
      setExpanded(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Đã đăng bài!");
    } catch {
      toast.error("Không thể đăng bài");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar src={user.avatarUrl} name={user.username} size="md" />
        <div className="flex-1">
          <textarea
            className={cn(
              "w-full bg-bg-muted rounded-xl px-4 py-3 text-sm text-fg",
              "placeholder:text-fg-subtle resize-none focus:outline-none",
              "focus:ring-2 focus:ring-primary/30 transition-all duration-200",
              expanded ? "min-h-[100px]" : "min-h-[44px]"
            )}
            placeholder={`${user.username} ơi, bạn đang nghĩ gì vậy?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
          />

          {expanded && (
            <div className="flex items-center justify-between mt-3 animate-fade-in">
              {/* Visibility picker */}
              <div className="flex items-center gap-2">
                {VISIBILITY_OPTIONS.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVisibility(value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all",
                      visibility === value
                        ? "bg-primary-subtle text-primary font-medium"
                        : "text-fg-muted hover:bg-bg-muted"
                    )}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-ghost py-1.5 px-3 text-xs"
                  onClick={() => { setExpanded(false); setContent(""); }}
                >
                  <X size={14} />
                </button>
                <button
                  className="btn-primary py-1.5 px-4 text-xs"
                  onClick={submit}
                  disabled={!content.trim() || loading}
                >
                  {loading ? <Spinner className="w-3 h-3" /> : "Đăng"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}