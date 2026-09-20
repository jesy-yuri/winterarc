import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Plus } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getMemberStats, type LocalStore } from '../../lib/localStore';

export function MyRooms({ store, today }: { store: LocalStore; today: string }) {
  if (store.rooms.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-14 lg:mt-16" aria-labelledby="my-rooms">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
            Continue
          </p>
          <h2 id="my-rooms" className="mt-3 font-display text-3xl leading-[1.02] text-ink uppercase sm:text-4xl">
            My Rooms
          </h2>
        </div>
        <Link
          to="/create"
          className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-ink"
        >
          <Plus size={14} aria-hidden="true" />
          Create room
        </Link>
      </div>
      <ul className="mt-5 flex flex-col gap-3 sm:mt-6">
        {store.rooms.map((room) => {
          const members = store.members.filter((m) => m.roomId === room.id);
          const currentMemberId =
            store.currentMemberByRoom[room.id] ?? members[0]?.id;
          const currentMember = members.find((m) => m.id === currentMemberId);
          const stats = getMemberStats(store, room.id, today);
          const myStat = stats.find((s) => s.member.id === currentMemberId);

          return (
            <li
              key={room.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                {currentMember && (
                  <Avatar
                    nickname={currentMember.nickname}
                    avatarUrl={currentMember.avatarUrl}
                    size="sm"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-ink">{room.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                    {currentMember ? `You are ${currentMember.nickname}` : 'No member'}
                    <span className="inline-flex items-center gap-1 rounded-md border border-accent/25 bg-accent/[0.10] px-1.5 py-0.5 text-[11px] font-semibold text-accent-strong tabular-nums">
                      <Flame size={11} aria-hidden="true" />
                      {myStat?.streak ?? 0}-day streak
                    </span>
                  </p>
                </div>
              </div>
              <Link
                to={`/room/${room.inviteCode}`}
                className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-semibold tracking-wide text-[#0b0d10] uppercase transition-colors duration-200 hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 sm:w-auto"
              >
                Enter
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
