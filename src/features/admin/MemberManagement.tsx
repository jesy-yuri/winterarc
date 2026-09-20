import { Crown, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, EmptyState } from '../../components/ui/Section';
import type { LocalStore } from '../../lib/localStore';
import type { Member, MemberRole } from '../../types';

function roleBadge(role: MemberRole) {
  if (role === 'owner')
    return (
      <Badge tone="warning">
        <Crown size={11} aria-hidden="true" />
        Owner
      </Badge>
    );
  if (role === 'admin')
    return (
      <Badge tone="accent">
        <ShieldCheck size={11} aria-hidden="true" />
        Admin
      </Badge>
    );
  return <Badge tone="neutral">Member</Badge>;
}

export function MemberManagement({
  store,
  members,
  currentMemberId,
  onSetRole,
  onRemove,
  onTransfer,
}: {
  store: LocalStore;
  members: Member[];
  currentMemberId: string | undefined;
  onSetRole: (targetMemberId: string, role: 'admin' | 'member') => void;
  onRemove: (targetMemberId: string) => void;
  onTransfer: (newOwnerMemberId: string) => void;
}) {
  const platformAdmins = new Set(store.platform?.systemAdminMemberIds ?? []);
  const sorted = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 } as const;
    return order[a.role] - order[b.role] || a.joinedAt.localeCompare(b.joinedAt);
  });

  if (members.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus size={20} aria-hidden="true" />}
        title="No members"
        body="Share the invite code so friends can join."
      />
    );
  }

  return (
    <ul className="flex flex-col overflow-hidden rounded-xl border border-line">
      {sorted.map((m, idx) => {
        const isSelf = m.id === currentMemberId;
        const isOwner = m.role === 'owner';
        return (
          <li
            key={m.id}
            className={`flex flex-col gap-3 bg-surface px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-4 ${idx > 0 ? 'border-t border-line' : ''}`}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="shrink-0">
                <Avatar nickname={m.nickname} avatarUrl={m.avatarUrl} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink sm:text-[15px]">
                  {m.nickname}
                  {isSelf && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                  {roleBadge(m.role)}
                  {platformAdmins.has(m.id) && <Badge tone="neutral">System admin</Badge>}
                </span>
              </span>
            </span>
            {!isOwner && (
              <span className="flex flex-wrap shrink-0 items-center gap-1.5">
                {m.role === 'member' ? (
                  <button
                    type="button"
                    onClick={() => onSetRole(m.id, 'admin')}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
                  >
                    <UserPlus size={13} aria-hidden="true" />
                    Make admin
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetRole(m.id, 'member')}
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
                  >
                    <UserMinus size={13} aria-hidden="true" />
                    Remove admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onTransfer(m.id)}
                  className="rounded-lg border border-warning/30 bg-warning/[0.07] px-2.5 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/15"
                >
                  Make owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove ${m.nickname} from this room?`)) onRemove(m.id);
                  }}
                  aria-label={`Remove ${m.nickname}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <UserMinus size={15} aria-hidden="true" />
                </button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function RoomRoleNote() {
  return (
    <p className="mt-3 text-[13px] leading-relaxed text-faint">
      Owners manage members, roles, settings, and ownership. Admins help with challenges,
      announcements, and goals. Members check in and join challenges.
    </p>
  );
}
