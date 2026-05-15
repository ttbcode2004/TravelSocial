// components/friends/UserCard.tsx
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { cn } from "../../utils";
import type { UserPreview } from "../../types";

interface UserCardProps {
  user: UserPreview & { mutualFriendsCount?: number };
  badge?: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}

export default function UserCard({ user, badge, actions, className }: UserCardProps) {
  return (
    <div className={cn("card p-4 flex items-center gap-3 hover:bg-bg-muted/50 transition-colors", className)}>
      <Link to={`/profile/${user.username}`}>
        <Avatar src={user.avatarUrl} name={user.username} size="md" />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.username}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {user.username}
        </Link>
        {user.isVerified && <span className="text-primary text-xs ml-1">✓</span>}

        {badge && <div className="text-xs text-fg-muted mt-0.5">{badge}</div>}
      </div>

      <div className="flex gap-2 flex-shrink-0">{actions}</div>
    </div>
  );
}