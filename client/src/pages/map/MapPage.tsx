import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import Avatar, { EmptyState, Spinner } from "../../components/ui/Avatar";
import { cn, timeAgo, formatCount } from "../../utils";
import { Map as MapIcon, Heart, MapPin, Compass, Search, Plus, X, Globe, Lock } from "lucide-react";
import toast from "react-hot-toast";
import type { MapLocation, LocationType } from "../../types";

const TYPE_STYLE: Record<LocationType, { label: string; color: string; icon: string }> = {
  VISITED:  { label: "Đã đến",    color: "badge-primary",  icon: "📍" },
  WISHLIST: { label: "Muốn đến", color: "badge-success",  icon: "⭐" },
};

// ─── Location Card ────────────────────────────────────────────

function LocationCard({ loc }: { loc: MapLocation & { distanceKm?: number } }) {
  const qc = useQueryClient();

  const toggleFav = useMutation({
    mutationFn: () => api.post(`/locations/${loc.id}/favorite`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success(res.data.favorited ? "Đã thêm yêu thích" : "Đã bỏ yêu thích");
    },
  });

  const meta = TYPE_STYLE[loc.locationType];

  return (
    <div className="card overflow-hidden hover:shadow-elevated transition-shadow group">
      {loc.coverImage ? (
        <div className="h-36 overflow-hidden">
          <img src={loc.coverImage} alt={loc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="h-36 bg-bg-muted flex items-center justify-center text-4xl">🗺️</div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {loc.name}
          </h3>
          <button
            className={cn("btn-icon p-1 flex-shrink-0", loc.isFavorited ? "text-danger" : "text-fg-subtle")}
            onClick={() => toggleFav.mutate()}
          >
            <Heart size={15} fill={loc.isFavorited ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn("badge text-xs", meta.color)}>{meta.icon} {meta.label}</span>
          {loc.distanceKm !== undefined && (
            <span className="text-xs text-fg-muted">{loc.distanceKm} km</span>
          )}
          {!loc.isPublic && <Lock size={11} className="text-fg-subtle" />}
        </div>

        {loc.description && (
          <p className="text-xs text-fg-muted line-clamp-2 mb-2">{loc.description}</p>
        )}

        {loc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {loc.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge-muted text-xs">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <div className="flex items-center gap-1">
            <Avatar src={loc.user.avatarUrl} name={loc.user.username} size="xs" />
            <span>{loc.user.username}</span>
          </div>
          <span className="flex items-center gap-1">
            <Heart size={11} />{formatCount(loc.favoritesCount)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Add Location Modal ───────────────────────────────────────

function AddLocationModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", description: "", latitude: "", longitude: "",
    locationType: "VISITED" as LocationType,
    isPublic: true, notes: "", tags: "",
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const create = useMutation({
    mutationFn: (data: object) => api.post("/locations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Đã thêm địa điểm!");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Lỗi"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      name: form.name,
      description: form.description || undefined,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      locationType: form.locationType,
      isPublic: form.isPublic,
      notes: form.notes || undefined,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md shadow-modal animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-bg-elevated">
          <h2 className="font-semibold">Thêm địa điểm</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tên địa điểm *</label>
            <input className="input" placeholder="Café Phố Cổ Hội An" value={form.name} onChange={set("name")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Vĩ độ *</label>
              <input className="input" type="number" step="any" placeholder="15.8800" value={form.latitude} onChange={set("latitude")} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Kinh độ *</label>
              <input className="input" type="number" step="any" placeholder="108.3380" value={form.longitude} onChange={set("longitude")} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Loại</label>
            <select className="input" value={form.locationType} onChange={set("locationType")}>
              <option value="VISITED">📍 Đã đến</option>
              <option value="WISHLIST">⭐ Muốn đến</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Mô tả</label>
            <textarea className="input min-h-[70px] resize-none" value={form.description} onChange={set("description") as any} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tags (cách nhau bởi dấu phẩy)</label>
            <input className="input" placeholder="cafe, binhyen, vintage" value={form.tags} onChange={set("tags")} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublic" checked={form.isPublic}
              onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="w-4 h-4 rounded" />
            <label htmlFor="isPublic" className="text-sm flex items-center gap-1.5">
              {form.isPublic ? <Globe size={14} /> : <Lock size={14} />}
              {form.isPublic ? "Công khai" : "Chỉ mình tôi"}
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
              {create.isPending ? <Spinner className="w-4 h-4" /> : "Thêm địa điểm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function MapPage() {
  const [tab, setTab] = useState<"my" | "explore" | "nearby">("my");
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<LocationType | "">("");
  const [showAdd, setShowAdd] = useState(false);

  // My map
  const { data: myMap, isLoading: loadingMy } = useQuery({
    queryKey: ["my-map"],
    queryFn: () => api.get("/locations/my-map").then((r) => r.data.data),
    enabled: tab === "my",
  });

  // Explore search
  const { data: searchData, isLoading: loadingSearch } = useQuery({
    queryKey: ["locations", q, typeFilter],
    queryFn: () =>
      api.get("/locations/search", {
        params: { q: q || undefined, locationType: typeFilter || undefined, limit: 20 },
      }).then((r) => r.data),
    enabled: tab === "explore",
  });

  const allMyLocations = [
    ...(myMap?.visited ?? []),
    ...(myMap?.wishlist ?? []),
  ] as MapLocation[];

  const exploreLocations: MapLocation[] = searchData?.items ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><MapIcon size={20} /> Bản đồ</h1>
          {myMap && (
            <p className="text-sm text-fg-muted mt-0.5">
              {myMap.stats.totalVisited} đã đến · {myMap.stats.totalWishlist} muốn đến
            </p>
          )}
        </div>
        <button className="btn-primary gap-2" onClick={() => setShowAdd(true)}>
          <Plus size={18} /> Thêm địa điểm
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-bg-muted p-1 rounded-xl mb-5">
        {(["my", "explore", "nearby"] as const).map((t) => (
          <button
            key={t}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg transition-all",
              tab === t ? "bg-bg-elevated text-fg font-medium shadow-card" : "text-fg-muted hover:text-fg"
            )}
            onClick={() => setTab(t)}
          >
            {t === "my" && <><MapPin size={14} /> Của tôi</>}
            {t === "explore" && <><Search size={14} /> Khám phá</>}
            {t === "nearby" && <><Compass size={14} /> Gần đây</>}
          </button>
        ))}
      </div>

      {/* Explore: search + filter */}
      {tab === "explore" && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
            <input className="input pl-9" placeholder="Tìm địa điểm..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input w-40" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="">Tất cả</option>
            <option value="VISITED">📍 Đã đến</option>
            <option value="WISHLIST">⭐ Muốn đến</option>
          </select>
        </div>
      )}

      {/* My map tabs */}
      {tab === "my" && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {(["", "VISITED", "WISHLIST"] as const).map((f) => (
              <button key={f} onClick={() => setTypeFilter(f as any)}
                className={cn("flex-shrink-0 text-xs py-1.5 px-3 rounded-full border transition-all",
                  typeFilter === f ? "bg-primary text-primary-fg border-primary" : "border-border text-fg-muted"
                )}>
                {f === "" ? "Tất cả" : TYPE_STYLE[f].label}
              </button>
            ))}
          </div>

          {loadingMy ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : allMyLocations.length === 0 ? (
            <EmptyState
              icon={<MapPin size={40} />}
              title="Chưa có địa điểm nào"
              description="Thêm những nơi bạn đã ghé thăm hoặc muốn đến"
              action={<button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Thêm địa điểm</button>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMyLocations
                .filter((l) => !typeFilter || l.locationType === typeFilter)
                .map((loc) => <LocationCard key={loc.id} loc={loc} />)}
            </div>
          )}
        </>
      )}

      {tab === "explore" && (
        loadingSearch ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : exploreLocations.length === 0 ? (
          <EmptyState icon={<Search size={36} />} title="Không tìm thấy địa điểm" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exploreLocations.map((loc) => <LocationCard key={loc.id} loc={loc} />)}
          </div>
        )
      )}

      {tab === "nearby" && (
        <EmptyState
          icon={<Compass size={40} />}
          title="Địa điểm gần bạn"
          description="Tính năng sử dụng GPS đang được phát triển"
        />
      )}

      {showAdd && <AddLocationModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}