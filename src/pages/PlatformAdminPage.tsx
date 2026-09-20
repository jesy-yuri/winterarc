import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Badge, EmptyState, SectionHeader, Stat } from '../components/ui/Section';
import type { LocalStore } from '../lib/localStore';

export function PlatformAdminPage({
  store,
  onGrant,
  onRevoke,
  onDeleteRoom,
}: {
  store: LocalStore;
  onGrant: (granterMemberId: string, targetMemberId: string) => void;
  onRevoke: (granterMemberId: string, targetMemberId: string) => void;
  onDeleteRoom: (roomId: string, actorMemberId: string) => void;
}) {
  const adminIds = store.platform?.systemAdminMemberIds ?? [];
  const admins = adminIds
    .map((id) => store.members.find((m) => m.id === id))
    .filter((m) => m !== undefined);
  const granter = admins[0];
  const [grantTarget, setGrantTarget] = useState('');
  const [error, setError] = useState('');

  if (!granter) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={<ShieldAlert size={20} aria-hidden="true" />}
          title="Not authorized"
          body="No system admin on this device. Please contact the platform owner."
          action={
            <Link to="/" className="text-sm text-accent hover:text-accent-strong">
              Back to home
            </Link>
          }
        />
      </main>
    );
  }

  function run(fn: () => void) {
    try {
      fn();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  const candidates = store.members.filter((m) => !adminIds.includes(m.id));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back
      </Link>

      <p className="mt-6 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase sm:mt-8">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        Platform
      </p>
      <h1 className="mt-3 font-display text-3xl leading-[1.02] break-words text-ink uppercase sm:text-4xl">
        System Administration
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Acting as <span className="font-medium text-ink">{granter.nickname}</span>. Device-local
        management — for real multi-device enforcement, connect a backend with server-side rules.
      </p>

      <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface px-1 sm:px-2">
        <Stat value={`${store.rooms.length}`} label="Rooms" />
        <Stat value={`${store.members.length}`} label="Members" />
        <Stat value={`${store.checkIns.length}`} label="Check-ins" />
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <section aria-labelledby="platform-admins" className="mt-10">
        <SectionHeader title="System admins" description="Can manage any room on this device." />
        <ul className="mt-4 flex flex-col overflow-hidden rounded-xl border border-line">
          {admins.map((m, idx) => {
            const room = store.rooms.find((r) => r.id === m.roomId);
            return (
              <li
                key={m.id}
                className={`flex flex-wrap items-center gap-3 bg-surface px-4 py-3 ${idx > 0 ? 'border-t border-line' : ''}`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0">
                    <Avatar nickname={m.nickname} avatarUrl={m.avatarUrl} size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {m.nickname}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-faint">
                      {room ? room.title : 'No room'} · {m.role}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone="warning">
                    <ShieldCheck size={11} aria-hidden="true" />
                    System admin
                  </Badge>
                  {m.id !== granter.id && (
                    <button
                      type="button"
                      onClick={() => run(() => onRevoke(granter.id, m.id))}
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
                    >
                      Revoke
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {candidates.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={grantTarget}
              onChange={(e) => setGrantTarget(e.target.value)}
              aria-label="Member to promote"
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm text-ink focus:border-accent/60 focus:outline-none"
            >
              <option value="">Select a member…</option>
              {candidates.map((m) => {
                const room = store.rooms.find((r) => r.id === m.roomId);
                return (
                  <option key={m.id} value={m.id}>
                    {m.nickname} ({room ? room.title : 'no room'})
                  </option>
                );
              })}
            </select>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!grantTarget}
              onClick={() => {
                if (!grantTarget) return;
                run(() => onGrant(granter.id, grantTarget));
                setGrantTarget('');
              }}
            >
              <UserPlus size={15} aria-hidden="true" />
              Grant admin
            </Button>
          </div>
        )}
      </section>

      <section aria-labelledby="platform-rooms" className="mt-10">
        <SectionHeader title="All rooms" description="Independent rooms on this device." />
        {store.rooms.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={20} aria-hidden="true" />}
            title="No rooms"
            body="Rooms created on this device will appear here."
          />
        ) : (
          <ul className="mt-4 flex flex-col overflow-hidden rounded-xl border border-line">
            {store.rooms.map((room, idx) => {
              const members = store.members.filter((m) => m.roomId === room.id);
              const owner = members.find((m) => m.id === room.ownerMemberId);
              const checkIns = store.checkIns.filter((c) => c.roomId === room.id).length;
              return (
                <li
                  key={room.id}
                  className={`flex flex-col gap-2 bg-surface px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${idx > 0 ? 'border-t border-line' : ''}`}
                >
                  <span className="min-w-0 flex-1">
                    <Link
                      to={`/room/${room.inviteCode}`}
                      className="block truncate text-[15px] font-medium text-ink hover:text-accent-strong"
                    >
                      {room.title}
                    </Link>
                    <span className="mt-0.5 block text-xs break-words text-faint">
                      {room.inviteCode} · Owner: {owner ? owner.nickname : '—'} ·{' '}
                      {members.length} members · {checkIns} check-ins
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete room "${room.title}" and all its data?`)) {
                        run(() => onDeleteRoom(room.id, granter.id));
                      }
                    }}
                    aria-label={`Delete ${room.title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
