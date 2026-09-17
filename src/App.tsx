import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useLocalArc } from './hooks/useLocalArc';
import { CreatePage } from './pages/CreatePage';
import { JoinPage } from './pages/JoinPage';
import { LandingPage } from './pages/LandingPage';
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
    handleSwitch,
    handleAnnouncement,
    checkIsAdmin,
    handleDeleteGoal,
    handleUpdateGoal,
    handleUpdateAvatar,
  } = useLocalArc();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage store={store} today={today} onJoin={handleJoin} />} />
        <Route path="/create" element={<CreatePage onCreate={handleCreate} />} />
        <Route path="/join/:code?" element={<JoinPage onJoin={handleJoin} />} />
        <Route
          path="/room/:code"
          element={
            <RoomPage
              store={store}
              today={today}
              onToggle={handleToggle}
              onToggleWorkout={handleToggleWorkout}
              onSaveWorkoutPlan={handleSaveWorkoutPlan}
              onSwitch={handleSwitch}
              onAnnouncement={handleAnnouncement}
              checkIsAdmin={checkIsAdmin}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onUpdateAvatar={handleUpdateAvatar}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
