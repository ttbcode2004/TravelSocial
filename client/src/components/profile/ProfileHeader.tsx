// components/profile/ProfileHeader.tsx
import Avatar from "../ui/Avatar";
import { formatDate } from "../../utils";
import type { User } from "../../types";

interface Props {
  user: User;
  isOwnProfile: boolean;
  children?: React.ReactNode; // Friend buttons + Message
}

export default function ProfileHeader({ user, isOwnProfile, children }: Props) {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-end justify-between -mt-12 mb-4">
        <Avatar
          src={user.avatarUrl}
          name={user.username}
          size="xl"
          className="ring-4 ring-bg"
        />
        <div className="flex gap-2 pb-1">{children}</div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{user.username}</h1>
          {user.isVerified && <span className="text-primary font-bold">✓</span>}
        </div>

        {user.bio && <p className="text-sm text-fg-muted mt-1">{user.bio}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-fg-subtle">
          <span className="flex items-center gap-1">
            Tham gia {formatDate(user.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}