import { avatarColor, avatarInitial, resolveAvatarUrl } from '../../lib/avatar';

const SIZE_CLASS = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const;

export function Avatar({
  nickname,
  avatarUrl,
  size = 'sm',
}: {
  nickname: string;
  avatarUrl?: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  const url = resolveAvatarUrl(avatarUrl);
  const cls = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white ${SIZE_CLASS[size]}`;
  if (url) {
    return (
      <img
        src={url}
        alt={`${nickname} profile`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`${cls} border border-line object-cover`}
      />
    );
  }
  return (
    <span className={`${cls} ${avatarColor(nickname)}`} aria-hidden="true">
      {avatarInitial(nickname)}
    </span>
  );
}
