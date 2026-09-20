import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthButton } from './components/ui/AuthButton';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { useLocalArc } from './hooks/useLocalArc';
import { useSupabaseArc } from './hooks/useSupabaseArc';
import { useSupabaseUser } from './hooks/useSupabaseUser';
import { CreatePage } from './pages/CreatePage';
import { JoinPage } from './pages/JoinPage';
import { LandingPage } from './pages/LandingPage';
import { PlatformAdminPage } from './pages/PlatformAdminPage';
import { RoomPage } from './pages/RoomPage';

function App() {
  const { user } = useSupabaseUser();
  const localArc = useLocalArc();
  const remoteArc = useSupabaseArc(user);
  // Signed in + configured → progress syncs per Gmail account across devices.
  // Otherwise the app runs fully local on this device.
  const arc = remoteArc.active ? remoteArc : localArc;
  const {
    store,
    today,
    handleCreate,
    handleJoin,
    handleToggle,
    handleToggleWorkout,
    handleSaveWorkoutPlan,
    handleAnnouncement,
    checkIsAdmin,
    checkIsOwner,
    handleUpdateRoom,
    handleSetMemberRole,
    handleTransferOwnership,
    handleRemoveMember,
    handleLeaveRoom,
    handleDeleteRoom,
    handleGrantPlatformAdmin,
    handleRevokePlatformAdmin,
    handleDeleteGoal,
    handleUpdateGoal,
    handleUpdateAvatar,
    handleCreatePersonalGoal,
    handleUpdatePersonalGoal,
    handleArchivePersonalGoal,
    handleDeletePersonalGoal,
    handleCreateChallenge,
    handleUpdateChallenge,
    handleDeleteChallenge,
    handleJoinChallenge,
    handleLeaveChallenge,
    handleSaveReflection,
    handleRecordUnlocks,
  } = arc;

  if (remoteArc.active && !remoteArc.ready) {
    return (
      <>
        <ThemeToggle />
        <AuthButton />
        <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
          <p className="mt-4 text-sm font-medium text-muted">Loading your crew…</p>
        </main>
      </>
    );
  }

  return (
    <BrowserRouter>
      <ThemeToggle />
      <AuthButton />
      <Routes>
        <Route path="/" element={<LandingPage store={store} today={today} onJoin={handleJoin} />} />
        <Route path="/create" element={<CreatePage onCreate={handleCreate} />} />
        <Route path="/join/:code?" element={<JoinPage onJoin={handleJoin} />} />
        <Route
          path="/admin"
          element={
            <PlatformAdminPage
              store={store}
              onGrant={handleGrantPlatformAdmin}
              onRevoke={handleRevokePlatformAdmin}
              onDeleteRoom={handleDeleteRoom}
            />
          }
        />
        <Route
          path="/room/:code"
          element={
            <RoomPage
              store={store}
              today={today}
              onToggle={handleToggle}
              onToggleWorkout={handleToggleWorkout}
              onSaveWorkoutPlan={handleSaveWorkoutPlan}
              onAnnouncement={handleAnnouncement}
              checkIsAdmin={checkIsAdmin}
              checkIsOwner={checkIsOwner}
              onUpdateRoom={handleUpdateRoom}
              onSetMemberRole={handleSetMemberRole}
              onTransferOwnership={handleTransferOwnership}
              onRemoveMember={handleRemoveMember}
              onLeaveRoom={handleLeaveRoom}
              onDeleteRoom={handleDeleteRoom}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onUpdateAvatar={handleUpdateAvatar}
              onCreatePersonalGoal={handleCreatePersonalGoal}
              onUpdatePersonalGoal={handleUpdatePersonalGoal}
              onArchivePersonalGoal={handleArchivePersonalGoal}
              onDeletePersonalGoal={handleDeletePersonalGoal}
              onCreateChallenge={handleCreateChallenge}
              onUpdateChallenge={handleUpdateChallenge}
              onDeleteChallenge={handleDeleteChallenge}
              onJoinChallenge={handleJoinChallenge}
              onLeaveChallenge={handleLeaveChallenge}
              onSaveReflection={handleSaveReflection}
              onRecordUnlocks={handleRecordUnlocks}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
