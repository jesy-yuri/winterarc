import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const SIZES: Record<Size, string> = {
  md: 'min-h-[44px] px-4 py-2.5 text-sm',
  sm: 'min-h-[36px] px-3 py-1.5 text-[13px]',
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-[0_1px_2px_rgb(68_56_44/0.15)] hover:bg-accent-strong active:bg-accent-strong',
  secondary:
    'border border-line bg-surface text-ink shadow-[0_1px_2px_rgb(68_56_44/0.06)] hover:border-accent/40 hover:bg-raised active:bg-raised',
  ghost: 'text-muted hover:bg-ink/[0.05] hover:text-ink active:bg-ink/[0.08]',
  danger:
    'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15 active:bg-danger/20',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-wide transition-colors duration-200 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 disabled:pointer-events-none disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
