import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400';
  const styles =
    variant === 'primary'
      ? 'bg-sky-500 text-white hover:bg-sky-400'
      : 'bg-white/5 text-slate-200 hover:bg-white/10';
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
