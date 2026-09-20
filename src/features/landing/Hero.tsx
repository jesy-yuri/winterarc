import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function Hero() {
  return (
    <header className="pt-10 pb-4 sm:pt-16 lg:pt-24">
      <p className="inline-block -rotate-2 bg-ink px-3 py-1.5 font-display text-sm tracking-[0.14em] text-base uppercase">
        No signup — just show up
      </p>
      <p className="mt-5 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        Winter Arc
      </p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[0.95] text-ink uppercase sm:text-6xl lg:text-7xl">
        Discipline is better <span className="text-accent-strong">together.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
        Build better habits. Stay consistent with your friends — check in every
        day, grow your streak, and finish the season together.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          className="w-full uppercase tracking-wider sm:w-auto"
          onClick={() => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Join a Room
        </Button>
        <Link to="/join" className="w-full sm:w-auto">
          <Button type="button" variant="secondary" className="w-full uppercase tracking-wider sm:w-auto">
            Enter a Room Code
          </Button>
        </Link>
      </div>
    </header>
  );
}
