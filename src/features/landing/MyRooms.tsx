import { Link } from 'react-router-dom';
import { getMemberStats, type LocalStore } from '../../lib/localStore';

export function MyRooms({ store, today }: { store: LocalStore; today: string }) {
  if (store.rooms.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-white">My Rooms</h2>
      <p className="mt-1 text-xs text-slate-400">
        Nakasali ka na dito. Click Enter para bumalik sa room mo.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-white">{room.title}</p>
                <p className="text-xs text-slate-400">
                  {currentMember ? `Ikaw si ${currentMember.nickname}` : 'No member'} -{' '}
                  {myStat?.streak ?? 0} day streak
                </p>
              </div>
              <Link
                to={`/room/${room.inviteCode}`}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-400"
              >
                Enter Room
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
