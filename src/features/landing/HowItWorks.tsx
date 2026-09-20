const STEPS = [
  {
    no: '01',
    title: 'Join',
    body: 'Ask your admin for the 6-letter code and join with your nickname. No signup, no password.',
    offset: '',
  },
  {
    no: '02',
    title: 'Check in',
    body: 'Check your goals and workout every day. Each check-in earns +10 XP and adds to your streak.',
    offset: 'sm:translate-y-5',
  },
  {
    no: '03',
    title: 'Grow',
    body: 'Track your rank on the leaderboard and finish the season consistently with your crew.',
    offset: '',
  },
];

export function HowItWorks() {
  return (
    <section className="mt-12 sm:mt-16 lg:mt-20" aria-labelledby="how-it-works">
      <p className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        How it works
      </p>
      <h2 id="how-it-works" className="mt-3 font-display text-3xl leading-[1.02] text-ink uppercase sm:text-4xl lg:text-5xl">
        Three steps. Zero excuses.
      </h2>
      <ol className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-3 sm:gap-5 lg:gap-6">
        {STEPS.map((s) => (
          <li
            key={s.no}
            className={`rounded-2xl border border-line bg-raised p-5 sm:p-6 ${s.offset}`}
          >
            <p aria-hidden="true" className="font-display text-5xl leading-none text-accent-strong">
              {s.no}
            </p>
            <h3 className="mt-3 font-display text-xl tracking-wide text-ink uppercase">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
