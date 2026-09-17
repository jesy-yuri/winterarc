import { useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import type { Announcement, Member } from '../../types';

export function AnnouncementBoard({
  announcements,
  members,
  isCurrentUserAdmin,
  onSend,
}: {
  announcements: Announcement[];
  members: Member[];
  isCurrentUserAdmin: boolean;
  onSend: (body: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {isCurrentUserAdmin ? (
        <AdminComposer onSend={onSend} />
      ) : (
        <p className="text-xs text-slate-400">
          Admin lang ang pwede mag send ng message dito. Read-only ka dito.
        </p>
      )}

      {announcements.length === 0 ? (
        <p className="text-sm text-slate-400">Wala pang announcement.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {announcements.map((a) => {
            const author = members.find((m) => m.id === a.authorMemberId);
            return (
              <li
                key={a.id}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
              >
                <p className="text-sm text-white">{a.body}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  {author && (
                    <Avatar nickname={author.nickname} avatarUrl={author.avatarUrl} size="xs" />
                  )}
                  {author?.nickname ?? 'Admin'} -{' '}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AdminComposer({ onSend }: { onSend: (body: string) => void }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  function submit() {
    try {
      onSend(body);
      setBody('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'May error sa pag send.');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message para sa barkada..."
        maxLength={500}
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div>
        <Button type="button" onClick={submit}>
          Send to all
        </Button>
      </div>
    </div>
  );
}
