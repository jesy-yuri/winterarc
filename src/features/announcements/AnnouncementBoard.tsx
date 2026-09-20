import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/Section';
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
    <div className="flex flex-col gap-6">
      {isCurrentUserAdmin && <AdminComposer onSend={onSend} />}

      {announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={20} aria-hidden="true" />}
          title="No announcements yet"
          body={
            isCurrentUserAdmin
              ? 'Send your first message to guide the room.'
              : 'Your admin will post guidance and reminders here.'
          }
        />
      ) : (
        <ul className="flex flex-col">
          {announcements.map((a) => {
            const author = members.find((m) => m.id === a.authorMemberId);
            return (
              <li key={a.id} className="border-b border-line py-4 first:pt-0 last:border-b-0">
                <p className="text-sm leading-relaxed break-words text-ink sm:text-[15px]">{a.body}</p>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs break-words text-faint">
                  {author && (
                    <Avatar nickname={author.nickname} avatarUrl={author.avatarUrl} size="xs" />
                  )}
                  {author?.nickname ?? 'Admin'} ·{' '}
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
      setError(e instanceof Error ? e.message : 'Something went wrong while sending.');
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <label htmlFor="announcement-body" className="block text-[13px] font-medium text-muted">
        New announcement
      </label>
      <textarea
        id="announcement-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message for the crew..."
        maxLength={500}
        rows={3}
        className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
      />
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-faint">{body.length}/500</p>
        <Button type="button" size="sm" onClick={submit} className="w-full sm:w-auto">
          <Send size={15} aria-hidden="true" />
          Send to all
        </Button>
      </div>
    </div>
  );
}
