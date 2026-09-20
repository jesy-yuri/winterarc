import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { LocalStore } from '../../lib/localStore';

export function RoomSwitcher({
  store,
  activeRoomId,
  compact = false,
}: {
  store: LocalStore;
  activeRoomId?: string;
  compact?: boolean;
}) {
  if (store.rooms.length === 0) return null;
  return (
    <div>
      {!compact && (
        <p className="text-xs font-semibold tracking-[0.2em] text-faint uppercase">
          My Rooms
        </p>
      )}
      <ul className={`flex flex-col ${compact ? 'gap-1.5' : 'mt-2 gap-1.5'}`}>
        {store.rooms.map((room) => {
          const members = store.members.filter((m) => m.roomId === room.id);
          const currentId = store.currentMemberByRoom[room.id] ?? members[0]?.id;
          const me = members.find((m) => m.id === currentId);
          const isActive = room.id === activeRoomId;
          return (
            <li key={room.id}>
              <Link
                to={`/room/${room.inviteCode}`}
                aria-current={isActive ? 'page' : undefined}
                className={`block rounded-xl border px-3.5 py-2.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 ${
                  isActive
                    ? 'border-accent/40 bg-accent/[0.08]'
                    : 'border-transparent hover:border-line hover:bg-surface'
                }`}
              >
                <span className="block truncate text-sm font-medium text-ink">
                  {room.title}
                </span>
                <span className="mt-0.5 block text-xs text-faint">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                  {me ? ` · You are ${me.nickname}` : ''}
                  {me ? ` (${me.role})` : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        to="/create"
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
      >
        <Plus size={15} aria-hidden="true" />
        Create room
      </Link>
    </div>
  );
}
