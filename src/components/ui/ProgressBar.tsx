export function ProgressBar({
  value,
  tone = 'accent',
  size = 'md',
}: {
  value: number;
  tone?: 'accent' | 'success';
  size?: 'md' | 'sm';
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-ink/[0.08] ${size === 'sm' ? 'h-1.5' : 'h-2'}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${
          tone === 'success' ? 'bg-success' : 'bg-accent'
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
