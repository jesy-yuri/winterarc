export function Hero() {
  return (
    <header className="relative overflow-hidden pt-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -top-10 right-10 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="relative flex flex-col items-start gap-4">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-widest text-sky-300 uppercase">
          Winter Arc Season
        </span>
        <h1 className="max-w-2xl text-4xl font-bold text-white sm:text-5xl">
          Discipline mo, may kasama.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Ang Winter Arc ay season ng focus. Dito ka mag check-in araw-araw,
          makikita mo streak mo, at makakasabayan mo barkada mo sa iisang room.
          Ikaw mag-isa ang mag-join gamit ang code na bigay ng admin.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Daily check-in
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Streak at XP
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Leaderboard
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Admin guidance
          </span>
        </div>
        <a
          href="#join"
          className="mt-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400"
        >
          Join gamit ang code
        </a>
      </div>
    </header>
  );
}
