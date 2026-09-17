const STEPS = [
  {
    no: '01',
    title: 'Hingi ng code',
    body: 'Ang admin ang gagawa ng room. Siya mag-send ng 6-letter code o invite link sa GC ninyo.',
  },
  {
    no: '02',
    title: 'Join sa landing page',
    body: 'Ilagay mo code at nickname mo sa Join box sa baba. Walang signup, walang password.',
  },
  {
    no: '03',
    title: 'Daily check-in',
    body: 'Araw-araw i-check mo goals mo. Aakyat XP at streak mo, makikita mo rank mo sa leaderboard.',
  },
];

export function HowItWorks() {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-white">Paano sumali</h2>
      <p className="mt-1 text-sm text-slate-400">
        Tatlong steps lang. Ikaw bilang member, join lang ang kailangan mo.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.no}
            className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-sky-500/40 hover:bg-white/10"
          >
            <p className="text-xs font-bold tracking-widest text-sky-400">{s.no}</p>
            <h3 className="mt-1 text-sm font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
