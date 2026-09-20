import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthButton } from './components/ui/AuthButton';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { useLocalArc } from './hooks/useLocalArc';
import { CreatePage } from './pages/CreatePage';
import { JoinPage } from './pages/JoinPage';
import { LandingPage } from './pages/LandingPage';
import { PlatformAdminPage } from './pages/PlatformAdminPage';
import { RoomPage } from './pages/RoomPage';

function App() {
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
  } = useLocalArc();

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
