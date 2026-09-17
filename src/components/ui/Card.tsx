import type { ReactNode } from 'react';

export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      <div className="text-sm text-slate-300">{children}</div>
    </div>
  );
}
