import { useState } from 'react';
import { CalendarPlus, Flag, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge, EmptyState, SectionHeader } from '../../components/ui/Section';
import type { LocalStore } from '../../lib/localStore';
import type { ChallengeInput } from '../../lib/localStore';
import type { Challenge, Member } from '../../types';
import {
  challengeDayNumber,
  challengeDaysLeft,
  challengeStatus,
  challengeTotalDays,
  memberChallengeDays,
} from '../../lib/progress';

const STATUS_TONE = {
  active: 'success',
  upcoming: 'accent',
  ended: 'neutral',
} as const;

const STATUS_LABEL = {
  active: 'Active',
  upcoming: 'Upcoming',
  ended: 'Ended',
} as const;

export function Challenges({
  store,
  roomId,
  members,
  currentMember,
  isCurrentUserAdmin,
  today,
  onCreate,
  onUpdate,
  onDelete,
  onJoin,
  onLeave,
}: {
  store: LocalStore;
  roomId: string;
  members: Member[];
  currentMember: Member | undefined;
  isCurrentUserAdmin: boolean;
  today: string;
  onCreate: (input: ChallengeInput) => void;
  onUpdate: (challengeId: string, input: ChallengeInput) => void;
  onDelete: (challengeId: string) => void;
  onJoin: (challengeId: string) => void;
  onLeave: (challengeId: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);

  const challenges = (store.challenges ?? [])
    .filter((c) => c.roomId === roomId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div>
      <SectionHeader
        eyebrow="Room"
        title="Challenges"
        description="Season challenges for the whole room. Progress comes from your daily check-ins."
        action={
          isCurrentUserAdmin ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen((v) => !v);
              }}
            >
              <CalendarPlus size={15} aria-hidden="true" />
              New challenge
            </Button>
          ) : undefined
        }
      />

      {formOpen && (
        <div className="mt-4">
          <ChallengeForm
            key={editing ? editing.id : 'new'}
            initial={editing}
            today={today}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSubmit={(input) => {
              if (editing) onUpdate(editing.id, input);
              else onCreate(input);
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      <div className="mt-4">
        {challenges.length === 0 ? (
          <EmptyState
            icon={<Flag size={20} aria-hidden="true" />}
            title="No challenges yet"
            body={
              isCurrentUserAdmin
                ? 'Create a 7, 14, or 30-day challenge to move the room together.'
                : 'Your room has no active challenges. Your admin can create one.'
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 md:gap-4 xl:gap-5">
            {challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                store={store}
                challenge={c}
                members={members}
                currentMember={currentMember}
                isCurrentUserAdmin={isCurrentUserAdmin}
                today={today}
                onJoin={() => currentMember && onJoin(c.id)}
                onLeave={() => currentMember && onLeave(c.id)}
                onEdit={() => {
                  setEditing(c);
                  setFormOpen(true);
                }}
                onDelete={() => {
                  if (window.confirm(`Delete challenge "${c.title}"?`)) onDelete(c.id);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChallengeForm({
  initial,
  today,
  onSubmit,
  onCancel,
}: {
  initial: Challenge | null;
  today: string;
  onSubmit: (input: ChallengeInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? today);
  const [error, setError] = useState('');

  function submit() {
    try {
      onSubmit({ title, description, startDate, endDate });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while saving.');
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3">
        <Input label="Challenge name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 7-Day Discipline Challenge" maxLength={80} />
        <div>
          <label htmlFor="ch-desc" className="block text-[13px] font-medium text-muted">
            Description
          </label>
          <textarea
            id="ch-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="What is the goal of this challenge?"
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="sm" onClick={submit}>
            {initial ? 'Save changes' : 'Create challenge'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({
  store,
  challenge,
  members,
  currentMember,
  isCurrentUserAdmin,
  today,
  onJoin,
  onLeave,
  onEdit,
  onDelete,
}: {
  store: LocalStore;
  challenge: Challenge;
  members: Member[];
  currentMember: Member | undefined;
  isCurrentUserAdmin: boolean;
  today: string;
  onJoin: () => void;
  onLeave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = challengeStatus(challenge, today);
  const total = challengeTotalDays(challenge);
  const dayNo = challengeDayNumber(challenge, today);
  const left = challengeDaysLeft(challenge, today);
  const joins = (store.challengeJoins ?? []).filter((j) => j.challengeId === challenge.id);
  const participants = joins
    .map((j) => members.find((m) => m.id === j.memberId))
    .filter((m): m is Member => Boolean(m));
  const joined = currentMember != null && joins.some((j) => j.memberId === currentMember.id);
  const myDays =
    currentMember != null ? memberChallengeDays(store, challenge, currentMember.id, challenge.roomId) : 0;
  const elapsed =
    status === 'upcoming' ? 0 : Math.min(total, Math.max(0, (dayNo ?? total)));
  const roomDays = participants.reduce(
    (s, m) => s + memberChallengeDays(store, challenge, m.id, challenge.roomId),
    0,
  );

  return (
    <li className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.15em] break-words text-faint uppercase">
            {challenge.startDate} – {challenge.endDate}
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight break-words text-ink sm:text-lg">{challenge.title}</h3>
          {challenge.description && (
            <p className="mt-1 text-sm leading-relaxed break-words text-muted">{challenge.description}</p>
          )}
        </div>
        <span className="w-fit shrink-0">
          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-base">
        <div className="px-2 py-3 text-center">
          <p className="text-lg font-semibold text-ink tabular-nums">
            {status === 'active' && dayNo != null ? `${dayNo}/${total}` : `${total}d`}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {status === 'active' ? 'Day' : status === 'upcoming' ? 'Duration' : 'Days'}
          </p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-lg font-semibold text-ink tabular-nums">
            {status === 'ended' ? '—' : status === 'upcoming' ? `${total}` : `${left}`}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {status === 'ended' ? 'Finished' : 'Days left'}
          </p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-lg font-semibold text-ink tabular-nums">{participants.length}</p>
          <p className="mt-0.5 text-xs text-muted">Joined</p>
        </div>
      </div>

      {joined && currentMember && (
        <div className="mt-3 rounded-xl border border-line bg-base px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-muted">Your progress</p>
            <p className="text-sm font-semibold text-ink tabular-nums">
              {myDays}/{elapsed || total} days
            </p>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-300"
              style={{ width: `${elapsed > 0 ? Math.min(100, Math.round((myDays / elapsed) * 100)) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-muted">
            Room progress: <span className="font-medium text-ink tabular-nums">{roomDays}</span> completed days
          </p>
        </div>
      )}

      {participants.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {participants.slice(0, 6).map((m) => (
              <Avatar key={m.id} nickname={m.nickname} avatarUrl={m.avatarUrl} size="xs" />
            ))}
          </div>
          <p className="truncate text-xs text-faint">
            {participants.map((m) => m.nickname).join(', ')}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {currentMember &&
          (joined ? (
            <Button type="button" variant="secondary" size="sm" onClick={onLeave}>
              <UserMinus size={15} aria-hidden="true" />
              Leave
            </Button>
          ) : (
            status !== 'ended' && (
              <Button type="button" size="sm" onClick={onJoin}>
                <UserPlus size={15} aria-hidden="true" />
                Join challenge
              </Button>
            )
          ))}
        {isCurrentUserAdmin && (
          <span className="ml-auto flex gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${challenge.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${challenge.title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </span>
        )}
      </div>
    </li>
  );
}
