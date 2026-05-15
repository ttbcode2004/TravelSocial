import { Search } from 'lucide-react'

export default function SearchUtils() {
  return (
    <button
    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg
                bg-bg-muted text-fg-subtle text-sm hover:bg-border
                transition-colors duration-150"
    onClick={() => {/* TODO: open search modal */}}
    >
    <Search size={14} />
    <span>Tìm kiếm...</span>
    </button>
)
}
