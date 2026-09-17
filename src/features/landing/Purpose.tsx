const ITEMS = [
  {
    title: 'Streak na nakikita',
    body: 'Bawat araw na mag-check-in ka, madadagdagan streak mo. Pag lumiban ka, reset. Simple at totoo.',
  },
  {
    title: 'Leaderboard ng barkada',
    body: 'Makikita mo sino consistent at sino kailangan habulin. Walang halo, XP at streak lang basehan.',
  },
  {
    title: 'Announcements galing admin',
    body: 'Admin lang pwede mag-send ng message. Ikaw magbabasa lang ng guidance at paalala.',
  },
  {
    title: 'Focus sa season',
    body: 'May start at end date ang room. Hindi forever, kaya mas madali panindigan hanggang dulo.',
  },
];

export function Purpose() {
  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold text-white">Para saan ito</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-400">
        Ginawa ito para sa Winter Arc challenge ng barkada. Hindi ito social
        media. Isa lang ang goal: tulungan kayo maging consistent sa gym, aral,
        tulog, at ipon sa loob ng season.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-white/20"
          >
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
