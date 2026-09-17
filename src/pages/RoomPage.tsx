import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { QRCodeDisplay } from '../components/ui/QRCodeDisplay';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { AnnouncementBoard } from '../features/announcements/AnnouncementBoard';
import { ArcProgress } from '../features/arc/ArcProgress';
import { DailyChecklist } from '../features/checkin/DailyChecklist';
import { CheckInHeatmap } from '../features/checkin/CheckInHeatmap';
import { Leaderboard } from '../features/leaderboard/Leaderboard';
import { ProfilePictureEditor } from '../features/profile/ProfilePictureEditor';
import { WorkoutPlanEditor } from '../features/workout/WorkoutPlanEditor';
import {
  getEnabledWorkouts,
  getMemberStats,
  getRoomAnalytics,
  getStreakBadge,
  getWorkoutSelections,
  type LocalStore,
} from '../lib/localStore';
import { workoutExerciseIdFromGoalId } from '../lib/workouts';

type Tab = 'checkin' | 'leaderboard' | 'announcements' | 'admin';

function tabClass(isActive: boolean, isAdminTab: boolean): string {
  const base = 'whitespace-nowrap px-4 py-2.5 text-sm transition';
  if (isActive) {
    return isAdminTab
      ? `${base} border-b-2 border-amber-400 font-medium text-amber-400`
      : `${base} border-b-2 border-sky-400 font-medium text-sky-400`;
  }
  return isAdminTab
    ? `${base} text-amber-400/70 hover:text-amber-400`
    : `${base} text-slate-400 hover:text-white`;
}

export function RoomPage({
  store,
  today,
  onToggle,
  onToggleWorkout,
  onSaveWorkoutPlan,
  onSwitch,
  onAnnouncement,
  checkIsAdmin,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateAvatar,
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
  onSwitch: (roomId: string, memberId: string) => void;
  onAnnouncement: (input: { roomId: string; authorMemberId: string; body: string }) => void;
  checkIsAdmin: (roomId: string, memberId: string | undefined) => boolean;
  onUpdateGoal: (goalId: string, newTitle: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateAvatar: (memberId: string, avatarUrl: string | null) => void;
}) {
  const { code } = useParams();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [tab, setTab] = useState<Tab>('checkin');
  const room = store.rooms.find(
    (r) => r.inviteCode.toUpperCase() === (code ?? '').toUpperCase(),
  );

  if (!room) {
    return (
      <main className="mx-auto w-full max-w-xl p-6">
        <p className="text-sm text-red-400">Hindi mahanap ang room.</p>
        <Link to="/" className="text-xs text-slate-400">
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
  const activeTab: Tab = !isCurrentUserAdmin && tab === 'admin' ? 'checkin' : tab;
  const myToday = store.checkIns.filter(
    (c) => c.roomId === room.id && c.memberId === currentMemberId && c.date === today,
  );
  const myGoalToday = myToday.filter((c) => workoutExerciseIdFromGoalId(c.goalId) === null);
  const myWorkoutToday = myToday.filter((c) => workoutExerciseIdFromGoalId(c.goalId) !== null);
  const stats = getMemberStats(store, room.id, today);
  const analytics = getRoomAnalytics(store, room.id);
  const myStat = stats.find((s) => s.member.id === currentMemberId);
  const workoutSelections =
    currentMemberId != null ? getWorkoutSelections(store, room.id, currentMemberId) : [];
  const enabledWorkouts =
    currentMemberId != null ? getEnabledWorkouts(store, room.id, currentMemberId) : [];
  const totalItems = goals.length + enabledWorkouts.length;
  const doneItems = myGoalToday.length + myWorkoutToday.length;
  const percent = totalItems === 0 ? 0 : (doneItems / totalItems) * 100;

  function copyInvite() {
    const link = `${window.location.origin}/join/${room!.inviteCode}`;
    void navigator.clipboard
      ?.writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setCopied(false));
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <Link to="/" className="text-xs text-slate-400 hover:text-white">
        Back
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{room.title}</h1>
            {isCurrentUserAdmin && (
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
                Admin view
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {room.startDate} to {room.endDate} - Code: {room.inviteCode}
          </p>
          <ArcProgress startDate={room.startDate} endDate={room.endDate} />
          {currentMember && (
            <div className="mt-2">
              <ProfilePictureEditor
                member={currentMember}
                onSave={(avatarUrl) => onUpdateAvatar(currentMember.id, avatarUrl)}
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={copyInvite}>
            {copied ? 'Copied' : 'Copy invite link'}
          </Button>
          <Button variant="ghost" onClick={() => setShowQR((v) => !v)}>
            {showQR ? 'Hide QR' : 'Show QR'}
          </Button>
        </div>
      </header>

      {showQR && (
        <div className="flex flex-col items-start gap-2">
          <QRCodeDisplay value={`${window.location.origin}/join/${room.inviteCode}`} />
          <p className="text-xs text-slate-400">
            Scan para mag join sa {room.title} gamit ang code {room.inviteCode}.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Today">
          <p className="text-xl font-bold text-white">
            {doneItems}/{totalItems}
          </p>
          <div className="mt-2">
            <ProgressBar value={percent} />
          </div>
          {enabledWorkouts.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-400">
              {myGoalToday.length}/{goals.length} goals - {myWorkoutToday.length}/
              {enabledWorkouts.length} workouts
            </p>
          )}
        </Card>
        <Card title="Streak">
          <p className="text-xl font-bold text-white">{myStat?.streak ?? 0} days</p>
          {(() => {
            const badge = getStreakBadge(myStat?.streak ?? 0);
            if (!badge) return <p className="mt-1 text-xs">Tuloy tuloy lang.</p>;
            return (
              <p className="mt-1 text-xs text-slate-300">
                <span className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide">
                  {badge.label}
                </span>
              </p>
            );
          })()}
        </Card>
        <Card title="XP">
          <p className="text-xl font-bold text-white">{myStat?.xp ?? 0}</p>
          <p className="mt-1 text-xs">10 XP per check-in.</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">View as:</span>
        <select
          value={currentMemberId ?? ''}
          onChange={(e) => onSwitch(room.id, e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nickname} ({m.role})
            </option>
          ))}
        </select>
        <Link to={`/join/${room.inviteCode}`} className="text-xs text-sky-400">
          Add friend (join with code)
        </Link>
      </div>

      <nav className="flex overflow-x-auto border-b border-white/10">
        <button type="button" onClick={() => setTab('checkin')} className={tabClass(activeTab === 'checkin', false)}>
          Check-in
        </button>
        <button type="button" onClick={() => setTab('leaderboard')} className={tabClass(activeTab === 'leaderboard', false)}>
          Leaderboard
        </button>
        <button type="button" onClick={() => setTab('announcements')} className={tabClass(activeTab === 'announcements', false)}>
          Announcements
        </button>
        {isCurrentUserAdmin && (
          <button type="button" onClick={() => setTab('admin')} className={tabClass(activeTab === 'admin', true)}>
            Admin
          </button>
        )}
      </nav>

      <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
        {activeTab === 'checkin' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-white">
                Check-in ngayon ({today})
              </h2>
              {currentMember ? (
                <DailyChecklist
                  goals={goals}
                  todayCheckIns={myGoalToday}
                  onToggle={(goalId) =>
                    onToggle({ roomId: room.id, memberId: currentMember.id, goalId })
                  }
                />
              ) : (
                <p className="text-sm text-slate-400">No member selected.</p>
              )}
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
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
                <p className="text-sm text-slate-400">No member selected.</p>
              )}
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-white">
                My History
              </summary>
              <div className="pt-3">
                {currentMember ? (
                  <CheckInHeatmap
                    checkIns={store.checkIns}
                    goals={goals}
                    startDate={room.startDate}
                    endDate={room.endDate}
                    memberId={currentMember.id}
                  />
                ) : (
                  <p className="text-sm text-slate-400">No member selected.</p>
                )}
              </div>
            </details>
          </div>
        )}

        {activeTab === 'leaderboard' && <Leaderboard stats={stats} />}

        {activeTab === 'announcements' && (
          <AnnouncementBoard
            announcements={announcements}
            members={members}
            isCurrentUserAdmin={isCurrentUserAdmin}
            onSend={(body) => {
              if (!currentMember) return;
              onAnnouncement({ roomId: room.id, authorMemberId: currentMember.id, body });
            }}
          />
        )}

        {activeTab === 'admin' && isCurrentUserAdmin && (
          <AdminDashboard
            analytics={analytics}
            stats={stats}
            onUpdateGoal={onUpdateGoal}
            onDeleteGoal={onDeleteGoal}
          />
        )}
      </div>
    </main>
  );
}
