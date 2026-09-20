import { Link } from 'react-router-dom';
import { Hero } from '../features/landing/Hero';
import { HowItWorks } from '../features/landing/HowItWorks';
import { JoinCard } from '../features/landing/JoinCard';
import { MyRooms } from '../features/landing/MyRooms';
import { Purpose } from '../features/landing/Purpose';
import type { LocalStore } from '../lib/localStore';

export function LandingPage({
  store,
  today,
  onJoin,
}: {
  store: LocalStore;
  today: string;
  onJoin: (input: { inviteCode: string; nickname: string }) => {
    room: { inviteCode: string };
  };
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6 md:max-w-3xl lg:max-w-4xl lg:px-8">
      <Hero />
      {store.rooms.length > 0 && <MyRooms store={store} today={today} />}
      <JoinCard onJoin={onJoin} />
      <HowItWorks />
      <Purpose />

      <footer className="mt-16 flex flex-col gap-3 border-t border-line pt-5 text-[13px] text-faint sm:mt-20 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span>Winter Arc Tracker — member access via code only.</span>
        <span className="flex items-center gap-4">
          <Link to="/create" className="transition-colors hover:text-muted">
            Create a room
          </Link>
          <Link to="/admin" className="transition-colors hover:text-muted">
            Platform admin
          </Link>
        </span>
      </footer>
    </main>
  );
}
