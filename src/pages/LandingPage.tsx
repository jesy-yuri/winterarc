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
    <main className="relative mx-auto min-h-screen w-full max-w-5xl px-6 pb-16">
      <Hero />
      {store.rooms.length > 0 && <MyRooms store={store} today={today} />}
      <JoinCard onJoin={onJoin} />
      <HowItWorks />
      <Purpose />

      <footer className="mt-14 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
        <span>Winter Arc Tracker - member access via code only.</span>
        <Link to="/create" className="text-slate-600 hover:text-slate-300">
          Admin
        </Link>
      </footer>
    </main>
  );
}
