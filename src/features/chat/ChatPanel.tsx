import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/Controls';
import { EmptyState } from '../../components/ui/Section';
import type { ChatMessage, Member } from '../../types';

const MAX_LENGTH = 500;

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

export function ChatPanel({
  messages,
  members,
  currentMember,
  canPost,
  chatError,
  onSend,
}: {
  messages: ChatMessage[];
  members: Member[];
  currentMember: Member | undefined;
  canPost: boolean;
  chatError: string | null;
  onSend: (body: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [profileMember, setProfileMember] = useState<Member | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollOnNewMessage = useRef(false);

  // Auto-scroll only right after this device successfully sent a message.
  // Never while reading history or typing.
  useEffect(() => {
    if (scrollOnNewMessage.current && bottomRef.current) {
      scrollOnNewMessage.current = false;
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    if (!profileMember) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileMember(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileMember]);

  async function submit() {
    const body = draft.trim();
    if (!body) {
      setError('Message cannot be empty.');
      return;
    }
    if (body.length > MAX_LENGTH) {
      setError('Message must be 500 characters or less.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await onSend(body);
      setDraft('');
      scrollOnNewMessage.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while sending.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {chatError && (
        <p role="status" className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] text-muted">
          {chatError}
        </p>
      )}

      {messages.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={20} aria-hidden="true" />}
          title="No messages yet"
          body="Say hello to the crew — new messages appear at the bottom."
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {messages.map((m) => {
            const author = members.find((x) => x.id === m.memberId);
            const isMine = currentMember != null && m.memberId === currentMember.id;
            const time = formatTime(m.createdAt);
            if (isMine) {
              return (
                <li key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] min-w-0 sm:max-w-[70%]">
                    <p className="rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm leading-relaxed break-words text-accent-ink">
                      {m.body}
                    </p>
                    {time && <p className="mt-1 text-right text-[11px] text-faint">{time}</p>}
                  </div>
                </li>
              );
            }
            return (
              <li key={m.id} className="flex min-w-0 items-start gap-2">
                {author && (
                  <span className="mt-0.5 shrink-0">
                    <Avatar nickname={author.nickname} avatarUrl={author.avatarUrl} size="xs" />
                  </span>
                )}
                <div className="max-w-[80%] min-w-0 sm:max-w-[70%]">
                  {author ? (
                    <button
                      type="button"
                      onClick={() => setProfileMember(author)}
                      className="max-w-full truncate text-left text-[13px] font-semibold text-accent transition-colors hover:text-accent-strong"
                    >
                      {author.nickname}
                    </button>
                  ) : (
                    <p className="text-[13px] font-medium text-faint">Removed member</p>
                  )}
                  <p className="mt-1 rounded-2xl rounded-bl-md border border-line bg-raised px-3.5 py-2.5 text-sm leading-relaxed break-words text-ink">
                    {m.body}
                  </p>
                  {time && <p className="mt-1 text-[11px] text-faint">{time}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div ref={bottomRef} aria-hidden="true" />

      {canPost && currentMember ? (
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <label htmlFor="chat-body" className="block text-[13px] font-medium text-muted">
            Message as {currentMember.nickname}
          </label>
          <textarea
            id="chat-body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Write something kind..."
            maxLength={MAX_LENGTH}
            rows={2}
            disabled={sending}
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none disabled:opacity-60"
          />
          {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-faint tabular-nums">{draft.length}/{MAX_LENGTH}</p>
            <Button
              type="button"
              size="sm"
              onClick={() => void submit()}
              disabled={!draft.trim() || sending}
              className="w-full sm:w-auto"
            >
              <Send size={15} aria-hidden="true" />
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] text-muted">
          Only room members can chat.
        </p>
      )}

      {profileMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setProfileMember(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${profileMember.nickname} profile`}
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="truncate text-[15px] font-semibold text-ink">{profileMember.nickname}</h3>
              <IconButton label="Close" onClick={() => setProfileMember(null)}>
                <X size={17} aria-hidden="true" />
              </IconButton>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Avatar nickname={profileMember.nickname} avatarUrl={profileMember.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="text-sm text-muted capitalize">{profileMember.role}</p>
                <p className="mt-0.5 text-[13px] text-faint">
                  Joined {new Date(profileMember.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
