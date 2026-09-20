import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  Check,
  Copy,
  Crown,
  Flag,
  Flame,
  LogOut,
  Megaphone,
  QrCode,
  Settings,
  ShieldCheck,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge, SectionHeader, Stat } from '../components/ui/Section';
import { Achievements } from '../features/achievements/Achievements';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { MemberManagement, RoomRoleNote } from '../features/admin/MemberManagement';
import { RoomSettingsForm } from '../features/admin/RoomSettingsForm';
import { AnnouncementBoard } from '../features/announcements/AnnouncementBoard';
import { ArcProgress } from '../features/arc/ArcProgress';
import { Challenges } from '../features/challenges/Challenges';
import { DailyChecklist } from '../features/checkin/DailyChecklist';
import { Leaderboard } from '../features/leaderboard/Leaderboard';
import { PersonalGoals } from '../features/personal/PersonalGoals';
import { ProgressCalendar } from '../features/progress/ProgressCalendar';
import { WeeklyReview } from '../features/progress/WeeklyReview';
import { RoomSwitcher } from '../features/rooms/RoomSwitcher';
import { WorkoutPlanEditor } from '../features/workout/WorkoutPlanEditor';
import { ProfilePictureEditor } from '../features/profile/ProfilePictureEditor';
import {
  getEnabledWorkouts,
  getMemberStats,
  getRoomAnalytics,
  getStreakBadge,
  getWorkoutSelections,
  personalGoalIdFromGoalId,
  type ChallengeInput,
  type LocalStore,
  type PersonalGoalInput,
  type RoomSettingsInput,
} from '../lib/localStore';
import { formatLongDate } from '../lib/progress';
import { workoutExerciseIdFromGoalId } from '../lib/workouts';
import type { MemberRole } from '../types';

type Tab = 'checkin' | 'progress' | 'challenges' | 'leaderboard' | 'announcements' | 'admin';

const TABS: { id: Tab; label: string; icon: typeof CalendarCheck; adminOnly?: boolean }[] = [
  { id: 'checkin', label: 'Today', icon: CalendarCheck },
  { id: 'progress', label: 'Progress', icon: Activity },
  { id: 'challenges', label: 'Challenges', icon: Flag },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'admin', label: 'Admin', icon: Settings, adminOnly: true },
];

function parseDay(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'owner') {
    return (
      <Badge tone="warning">
        <Crown size={11} aria-hidden="true" />
        Owner
      </Badge>
    );
  }
  if (role === 'admin') {
    return (
      <Badge tone="accent">
        <ShieldCheck size={11} aria-hidden="true" />
        Admin
      </Badge>
    );
  }
  return <Badge tone="neutral">Member</Badge>;
}

function tabButtonClass(isActive: boolean, isAdminTab: boolean): string {
  const base = 'transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60';
  if (isActive) {
    return isAdminTab
      ? `${base} border-warning font-bold text-warning`
      : `${base} border-accent font-bold text-ink`;
  }
  return isAdminTab
    ? `${base} border-transparent text-warning/70 hover:text-warning`
    : `${base} border-transparent text-muted hover:text-ink`;
}

export function RoomPage({
  store,
  today,
  onToggle,
  onToggleWorkout,
  onSaveWorkoutPlan,
  onAnnouncement,
  checkIsAdmin,
  checkIsOwner,
  onUpdateRoom,
  onSetMemberRole,
  onTransferOwnership,
  onRemoveMember,
  onLeaveRoom,
  onDeleteRoom,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateAvatar,
  onCreatePersonalGoal,
  onUpdatePersonalGoal,
  onArchivePersonalGoal,
  onDeletePersonalGoal,
  onCreateChallenge,
  onUpdateChallenge,
  onDeleteChallenge,
  onJoinChallenge,
  onLeaveChallenge,
  onSaveReflection,
  onRecordUnlocks,
}: {
  store: LocalStore;
  today: string;
  onToggle: (input: { roomId: string; memberId: string; goalId: string }) => void;
  onToggleWorkout: (input: { roomId: string; memberId: string; exerciseId: string }) => void;
  onSaveWorkoutPlan: (input: {
    roomId: string;
    memberId: string;
    selections: { exerciseId: string; included: boolean; targetCount: number }[];
  }) => void;
  onAnnouncement: (input: { roomId: string; authorMemberId: string; body: string }) => void;
  checkIsAdmin: (roomId: string, memberId: string | undefined) => boolean;
  checkIsOwner: (roomId: string, memberId: string | undefined) => boolean;
  onUpdateRoom: (roomId: string, actorMemberId: string, input: RoomSettingsInput) => void;
  onSetMemberRole: (
    roomId: string,
    actorMemberId: string,
    targetMemberId: string,
    role: 'admin' | 'member',
  ) => void;
  onTransferOwnership: (roomId: string, actorMemberId: string, newOwnerMemberId: string) => void;
  onRemoveMember: (roomId: string, actorMemberId: string, targetMemberId: string) => void;
  onLeaveRoom: (roomId: string, memberId: string) => void;
  onDeleteRoom: (roomId: string, actorMemberId: string) => void;
  onUpdateGoal: (goalId: string, newTitle: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateAvatar: (memberId: string, avatarUrl: string | null) => void;
  onCreatePersonalGoal: (memberId: string, input: PersonalGoalInput) => void;
  onUpdatePersonalGoal: (goalId: string, input: PersonalGoalInput) => void;
  onArchivePersonalGoal: (goalId: string, isActive: boolean) => void;
  onDeletePersonalGoal: (goalId: string) => void;
  onCreateChallenge: (input: { roomId: string; createdByMemberId: string } & ChallengeInput) => void;
  onUpdateChallenge: (challengeId: string, input: ChallengeInput) => void;
  onDeleteChallenge: (challengeId: string) => void;
  onJoinChallenge: (challengeId: string, memberId: string) => void;
  onLeaveChallenge: (challengeId: string, memberId: string) => void;
  onSaveReflection: (input: { memberId: string; weekKey: string; wentWell: string; improve: string }) => void;
  onRecordUnlocks: (memberId: string, achievementIds: string[]) => void;
}) {
  const { code } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [tab, setTab] = useState<Tab>('checkin');
  const [adminError, setAdminError] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const room = store.rooms.find(
    (r) => r.inviteCode.toUpperCase() === (code ?? '').toUpperCase(),
  );

  if (!room) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-[15px] text-danger">Something went wrong while loading this room.</p>
        <p className="mt-1 text-sm text-muted">We could not find the room you are looking for.</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-strong"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>
      </main>
    );
  }

  const members = store.members.filter((m) => m.roomId === room.id);
  const goals = store.goals.filter((g) => g.roomId === room.id);
  const announcements = store.announcements
    .filter((a) => a.roomId === room.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const currentMemberId = store.currentMemberByRoom[room.id] ?? members[0]?.id;
  const currentMember = members.find((m) => m.id === currentMemberId);
  const isCurrentUserAdmin = checkIsAdmin(room.id, currentMemberId);
  const isCurrentUserOwner = checkIsOwner(room.id, currentMemberId);
  const activeTab: Tab = !isCurrentUserAdmin && tab === 'admin' ? 'checkin' : tab;
  const myToday = store.checkIns.filter(
    (c) => c.roomId === room.id && c.memberId === currentMemberId && c.date === today,
  );
  const myGoalToday = myToday.filter(
    (c) =>
      workoutExerciseIdFromGoalId(c.goalId) === null &&
      personalGoalIdFromGoalId(c.goalId) === null,
  );
  const myWorkoutToday = myToday.filter((c) => workoutExerciseIdFromGoalId(c.goalId) !== null);
  const myPersonalToday = myToday.filter((c) => personalGoalIdFromGoalId(c.goalId) !== null);
  const stats = getMemberStats(store, room.id, today);
  const analytics = getRoomAnalytics(store, room.id);
  const myStat = stats.find((s) => s.member.id === currentMemberId);
  const myRank = stats.findIndex((s) => s.member.id === currentMemberId) + 1;
  const workoutSelections =
    currentMemberId != null ? getWorkoutSelections(store, room.id, currentMemberId) : [];
  const enabledWorkouts =
    currentMemberId != null ? getEnabledWorkouts(store, room.id, currentMemberId) : [];
  const personalGoals =
    currentMemberId != null ? (store.personalGoals ?? []).filter((g) => g.memberId === currentMemberId) : [];
  const activePersonalCount = personalGoals.filter((g) => g.isActive).length;
  const totalItems = goals.length + activePersonalCount + enabledWorkouts.length;
  const doneItems = myGoalToday.length + myPersonalToday.length + myWorkoutToday.length;
  const percent = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);
  const dayComplete = totalItems > 0 && doneItems >= totalItems;
  const streakBadge = getStreakBadge(myStat?.streak ?? 0);

  const start = parseDay(room.startDate);
  const end = parseDay(room.endDate);
  const now = parseDay(today);
  const totalDays =
    start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1 : null;
  const dayNumber =
    start && now && totalDays && totalDays > 0
      ? Math.round((now.getTime() - start.getTime()) / 86400000) + 1
      : null;
  const inSeason = dayNumber != null && totalDays != null && dayNumber >= 1 && dayNumber <= totalDays;
  const roomId = room.id;
  const roomTitle = room.title;
  const inviteLink = `${window.location.origin}/join/${room.inviteCode}`;

  function copyInvite() {
    void navigator.clipboard
      ?.writeText(inviteLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setCopied(false));
  }

  function runAdmin(fn: () => void) {
    try {
      fn();
      setAdminError('');
    } catch (e) {
      setAdminError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  function leave() {
    if (!currentMember) return;
    const label =
      currentMember.role === 'owner' && members.length > 1
        ? 'You are the owner. You can only leave if you are the only member — the room will be deleted. Continue?'
        : `Leave "${roomTitle}"? Your check-ins and goals in this room will be removed.`;
    if (!window.confirm(label)) return;
    try {
      onLeaveRoom(roomId, currentMember.id);
      setLeaveError('');
      navigate('/');
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : 'Something went wrong while leaving.');
    }
  }

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isCurrentUserAdmin);

  const tabButtons = (vertical: boolean) =>
    visibleTabs.map((t) => {
      const isActive = activeTab === t.id;
      const Icon = t.icon;
      const isAdminTab = t.id === 'admin';
      return (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          aria-current={isActive ? 'page' : undefined}
          className={`flex items-center gap-2.5 text-sm whitespace-nowrap ${vertical ? 'w-full rounded-xl px-3.5 py-2.5' : 'shrink-0 border-b-2 px-3 py-2.5 sm:px-3.5'} ${tabButtonClass(isActive, isAdminTab)} ${
            vertical && isActive && !isAdminTab ? 'bg-surface shadow-card' : ''
          } ${vertical && isActive && isAdminTab ? 'bg-warning/[0.12]' : ''}`}
        >
          <Icon size={16} aria-hidden="true" />
          {t.label}
        </button>
      );
    });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:mx-auto lg:px-8">
      <div className="md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Desktop / tablet sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-8 flex flex-col gap-6 py-8">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                All rooms
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-ink">
                  {room.title}
                </h1>
              </div>
              <div className="mt-1.5">
                {currentMember && <RoleBadge role={currentMember.role} />}
              </div>
            </div>
            <nav aria-label="Room sections" className="flex flex-col gap-1">
              {tabButtons(true)}
            </nav>
            <div className="border-t border-line pt-4">
              <RoomSwitcher store={store} activeRoomId={room.id} />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <main className="mx-auto w-full max-w-2xl px-0 pt-6 pb-16 md:mx-0 md:max-w-none md:px-0 md:py-8 lg:max-w-3xl xl:max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink md:hidden"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            All rooms
          </Link>

          {/* Room header */}
          <header className="mt-4 md:mt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
                  Winter Arc Room
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 font-display text-2xl leading-[1.02] break-words text-ink uppercase sm:text-3xl">
                    {room.title}
                  </h1>
                  {currentMember && <RoleBadge role={currentMember.role} />}
                </div>
                {room.description && (
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed break-words text-muted">
                    {room.description}
                  </p>
                )}
                <p className="mt-1.5 text-[13px] break-words text-muted">
                  {room.startDate} — {room.endDate}
                  {inSeason && dayNumber != null && totalDays != null && (
                    <> · Day {dayNumber} of {totalDays}</>
                  )}{' '}
                  · Code {room.inviteCode}
                </p>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto">
                <Button type="button" variant="secondary" size="sm" onClick={copyInvite} className="w-full sm:w-auto">
                  {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy invite'}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowQR((v) => !v)} className="w-full sm:w-auto">
                  <QrCode size={15} aria-hidden="true" />
                  {showQR ? 'Hide QR' : 'QR'}
                </Button>
              </div>
            </div>

            {showQR && (
              <div className="mt-4">
                <Card
                  title="Invite with QR"
                  subtitle={`Scan to join ${room.title} with code ${room.inviteCode}.`}
                >
                  <QRCodeDisplay value={`${window.location.origin}/join/${room.inviteCode}`} />
                </Card>
              </div>
            )}

            <details className="mt-4 md:hidden">
              <summary className="cursor-pointer text-[13px] font-medium text-muted">
                Switch room
              </summary>
              <div className="pt-2">
                <RoomSwitcher store={store} activeRoomId={room.id} compact />
              </div>
            </details>

            {currentMember && (
              <div className="mt-4 border-t border-line pt-4">
                <ProfilePictureEditor
                  member={currentMember}
                  onSave={(avatarUrl) => onUpdateAvatar(currentMember.id, avatarUrl)}
                />
              </div>
            )}
          </header>

          {/* Mobile + tablet tabs */}
          <nav aria-label="Room sections" className="no-scrollbar -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6 md:hidden">
            {tabButtons(false)}
          </nav>

          {activeTab === 'checkin' && (
            <div className="mt-6 grid gap-8 sm:mt-8 md:gap-10 lg:grid-cols-2 lg:items-start lg:gap-8 xl:gap-10">
              <div className="flex min-w-0 flex-col gap-8 md:gap-10">
                {/* Today's progress */}
                <section aria-labelledby="today-progress">
                  <SectionHeader
                    eyebrow="Today"
                    title="Today's Progress"
                    description={formatLongDate(today)}
                  />
                  <div className="mt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                        {doneItems} <span className="text-base font-normal text-muted">/ {totalItems} completed</span>
                      </p>
                      <p className="text-sm font-medium text-muted">{percent}%</p>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={percent} />
                    </div>
                    {totalItems > 0 && (
                      <p className="mt-2 text-[13px] text-faint">
                        {myGoalToday.length}/{goals.length} goals · {myPersonalToday.length}/
                        {activePersonalCount} personal · {myWorkoutToday.length}/
                        {enabledWorkouts.length} workouts
                      </p>
                    )}
                    <p
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium ${
                        dayComplete
                          ? 'border-success/30 bg-success/[0.12] text-success'
                          : 'border-line bg-surface text-muted'
                      }`}
                      aria-live="polite"
                    >
                      <Check size={15} strokeWidth={3} aria-hidden="true" />
                      {totalItems === 0
                        ? 'Add a goal or workout to start today.'
                        : dayComplete
                          ? 'Day Complete — you stayed consistent today.'
                          : `Keep going — ${totalItems - doneItems} to go.`}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface px-1 sm:px-2">
                    <Stat
                      icon={<Flame size={17} aria-hidden="true" />}
                      value={`${myStat?.streak ?? 0}`}
                      label={streakBadge ? `Day streak · ${streakBadge.label}` : 'Day streak'}
                    />
                    <Stat
                      icon={<Zap size={17} aria-hidden="true" />}
                      value={`${myStat?.xp ?? 0}`}
                      label="Total XP"
                    />
                    <Stat
                      icon={<Trophy size={17} aria-hidden="true" />}
                      value={myRank > 0 ? `#${myRank}` : '—'}
                      label="Room rank"
                    />
                  </div>
                </section>

                {/* Today's goals */}
                <section aria-labelledby="today-goals">
                  <SectionHeader
                    eyebrow="Check-in"
                    title="Today's Goals"
                    description="Tap a goal to check it in. Each check-in earns +10 XP."
                  />
                  <div className="mt-4">
                    {currentMember ? (
                      <DailyChecklist
                        goals={goals}
                        todayCheckIns={myGoalToday}
                        onToggle={(goalId) =>
                          onToggle({ roomId: room.id, memberId: currentMember.id, goalId })
                        }
                      />
                    ) : (
                      <p className="text-sm text-muted">No member selected.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="flex min-w-0 flex-col gap-8 md:gap-10">
                {/* Personal goals */}
                <section aria-labelledby="personal-goals">
                  {currentMember ? (
                    <PersonalGoals
                      goals={personalGoals}
                      todayDoneKeys={new Set(myToday.map((c) => c.goalId))}
                      onToggle={(checkInKey) =>
                        onToggle({ roomId: room.id, memberId: currentMember.id, goalId: checkInKey })
                      }
                      onCreate={(input) => onCreatePersonalGoal(currentMember.id, input)}
                      onUpdate={(goalId, input) => onUpdatePersonalGoal(goalId, input)}
                      onArchive={(goalId, isActive) => onArchivePersonalGoal(goalId, isActive)}
                      onDelete={(goalId) => onDeletePersonalGoal(goalId)}
                    />
                  ) : (
                    <p className="text-sm text-muted">No member selected.</p>
                  )}
                </section>

                {/* Workout */}
                <section aria-labelledby="today-workout">
                  {currentMember ? (
                    <WorkoutPlanEditor
                      selections={workoutSelections}
                      enabledWorkouts={enabledWorkouts}
                      todayCheckIns={myWorkoutToday}
                      onSave={(selections) =>
                        onSaveWorkoutPlan({ roomId: room.id, memberId: currentMember.id, selections })
                      }
                      onToggleWorkout={(exerciseId) =>
                        onToggleWorkout({ roomId: room.id, memberId: currentMember.id, exerciseId })
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted">No member selected.</p>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === 'progress' && currentMember && (
            <div className="mt-6 flex flex-col gap-8 sm:mt-8 md:gap-10">
              <section aria-labelledby="season-progress">
                <SectionHeader
                  eyebrow="Progress"
                  title="Season Progress"
                  description="Your consistency across the whole arc."
                />
                <div className="mt-4">
                  <ArcProgress startDate={room.startDate} endDate={room.endDate} />
                </div>
              </section>

              <section aria-labelledby="progress-calendar">
                <ProgressCalendar
                  store={store}
                  roomId={room.id}
                  memberId={currentMember.id}
                  today={today}
                />
              </section>

              <section aria-labelledby="weekly-review">
                <WeeklyReview
                  store={store}
                  roomId={room.id}
                  memberId={currentMember.id}
                  today={today}
                  onSaveReflection={(input) => onSaveReflection(input)}
                />
              </section>

              <section aria-labelledby="achievements">
                <Achievements
                  store={store}
                  roomId={room.id}
                  memberId={currentMember.id}
                  today={today}
                  onUnlock={(ids) => onRecordUnlocks(currentMember.id, ids)}
                />
              </section>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="mt-6 sm:mt-8">
              <Challenges
                store={store}
                roomId={room.id}
                members={members}
                currentMember={currentMember}
                isCurrentUserAdmin={isCurrentUserAdmin}
                today={today}
                onCreate={(input) =>
                  currentMember &&
                  onCreateChallenge({ roomId: room.id, createdByMemberId: currentMember.id, ...input })
                }
                onUpdate={(challengeId, input) => onUpdateChallenge(challengeId, input)}
                onDelete={(challengeId) => onDeleteChallenge(challengeId)}
                onJoin={(challengeId) => currentMember && onJoinChallenge(challengeId, currentMember.id)}
                onLeave={(challengeId) =>
                  currentMember && onLeaveChallenge(challengeId, currentMember.id)
                }
              />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="mt-6 sm:mt-8">
              <SectionHeader
                eyebrow="Community"
                title="Leaderboard"
                description="Ranked by XP, then by streak. Keep showing up."
              />
              <div className="mt-4">
                <Leaderboard stats={stats} currentMemberId={currentMemberId} />
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="mt-6 sm:mt-8">
              <SectionHeader
                eyebrow="Community"
                title="Announcements"
                description={
                  isCurrentUserAdmin
                    ? 'Send guidance and reminders to the whole room.'
                    : 'Read-only. Only owners and admins can send messages here.'
                }
              />
              <div className="mt-4">
                <AnnouncementBoard
                  announcements={announcements}
                  members={members}
                  isCurrentUserAdmin={isCurrentUserAdmin}
                  onSend={(body) => {
                    if (!currentMember) return;
                    onAnnouncement({ roomId: room.id, authorMemberId: currentMember.id, body });
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'admin' && isCurrentUserAdmin && (
            <div className="mt-6 flex flex-col gap-8 sm:mt-8 md:gap-10">
              <section aria-labelledby="admin-analytics">
                <SectionHeader
                  eyebrow="Room"
                  title="Admin"
                  description="Room analytics and goal management."
                />
                <div className="mt-4">
                  <AdminDashboard
                    analytics={analytics}
                    stats={stats}
                    onUpdateGoal={onUpdateGoal}
                    onDeleteGoal={onDeleteGoal}
                  />
                </div>
              </section>

              {isCurrentUserOwner && currentMember && (
                <>
                  <section aria-labelledby="admin-members">
                    <SectionHeader
                      title="Members"
                      description={`${members.length} ${members.length === 1 ? 'member' : 'members'} in this room. Only owners can change roles.`}
                    />
                    {adminError && <p className="mt-3 text-sm text-danger">{adminError}</p>}
                    <div className="mt-4">
                      <MemberManagement
                        store={store}
                        members={members}
                        currentMemberId={currentMember.id}
                        onSetRole={(targetId, role) =>
                          runAdmin(() => onSetMemberRole(room.id, currentMember.id, targetId, role))
                        }
                        onRemove={(targetId) =>
                          runAdmin(() => onRemoveMember(room.id, currentMember.id, targetId))
                        }
                        onTransfer={(newOwnerId) => {
                          const target = members.find((m) => m.id === newOwnerId);
                          if (
                            window.confirm(
                              `Transfer ownership to ${target?.nickname ?? 'this member'}? You will become an admin.`,
                            )
                          ) {
                            runAdmin(() =>
                              onTransferOwnership(room.id, currentMember.id, newOwnerId),
                            );
                          }
                        }}
                      />
                      <RoomRoleNote />
                    </div>
                  </section>

                  <section aria-labelledby="admin-settings">
                    <SectionHeader
                      title="Room settings"
                      description="Name, description, and season dates."
                    />
                    <div className="mt-4">
                      <RoomSettingsForm
                        room={room}
                        onSave={(input) => onUpdateRoom(room.id, currentMember.id, input)}
                      />
                    </div>
                  </section>

                  <section
                    aria-labelledby="admin-danger"
                    className="rounded-2xl border border-danger/25 p-5"
                  >
                    <h2 id="admin-danger" className="text-lg font-semibold text-danger">
                      Danger zone
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      Deleting the room removes all its goals, check-ins, challenges, and members.
                      This cannot be undone.
                    </p>
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete room "${room.title}" and all its data?`)) {
                            try {
                              onDeleteRoom(room.id, currentMember.id);
                              navigate('/');
                            } catch (e) {
                              setAdminError(
                                e instanceof Error ? e.message : 'Something went wrong while deleting.',
                              );
                            }
                          }
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Delete room
                      </Button>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* Your membership — device-bound identity, no impersonation switching */}
          <section aria-label="Your membership" className="mt-8 border-t border-line pt-6 sm:mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-faint">
                <Users size={15} aria-hidden="true" />
                Signed in as
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {currentMember ? (
                  <>
                    <Avatar nickname={currentMember.nickname} avatarUrl={currentMember.avatarUrl} size="xs" />
                    <span className="truncate text-[13px] font-semibold text-ink">
                      {currentMember.nickname}
                    </span>
                    <RoleBadge role={currentMember.role} />
                  </>
                ) : (
                  <span className="text-[13px] text-muted">No member found on this device.</span>
                )}
              </div>
              <Link
                to={`/join/${room.inviteCode}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-accent transition-colors hover:text-accent-strong"
              >
                <UserPlus size={15} aria-hidden="true" />
                Invite a friend
              </Link>
            </div>
            {currentMember && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={leave}
                  className="inline-flex items-center gap-1.5 text-[13px] text-faint transition-colors hover:text-danger"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Leave room
                </button>
                {leaveError && <span className="text-[13px] text-danger">{leaveError}</span>}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
