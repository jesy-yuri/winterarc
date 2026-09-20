import { CalendarRange, Flame, Megaphone, Trophy } from 'lucide-react';

const ITEMS = [
  {
    title: 'Visible streak',
    body: 'Every day you check in, your streak grows. Miss a day and it resets. Simple and honest.',
    icon: Flame,
    span: 'sm:col-span-2',
  },
  {
    title: 'Crew leaderboard',
    body: 'See who is consistent and who you need to catch up with. Ranked by XP and streak only.',
    icon: Trophy,
    span: '',
  },
  {
    title: 'Admin announcements',
    body: 'Only admins can send messages. You just read their guidance and reminders.',
    icon: Megaphone,
    span: '',
  },
  {
    title: 'Season focus',
    body: 'Every room has a start and end date. Not forever, so it is easier to commit until the end.',
    icon: CalendarRange,
    span: 'sm:col-span-2',
  },
];

export function Purpose() {
  return (
    <section className="mt-12 sm:mt-16 lg:mt-20" aria-labelledby="purpose">
      <p className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        Why Winter Arc
      </p>
      <h2 id="purpose" className="mt-3 max-w-2xl font-display text-3xl leading-[1.02] text-ink uppercase sm:text-4xl lg:text-5xl">
        Not social media. Just consistency.
      </h2>
      <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.title}
              className={`rounded-2xl border border-line bg-surface p-5 transition-transform duration-200 motion-safe:hover:scale-[1.02] sm:p-6 ${item.span}`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/[0.12] text-accent-strong">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold tracking-tight text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
