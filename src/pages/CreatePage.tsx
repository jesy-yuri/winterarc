import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { CreateRoomForm } from '../features/arc/CreateRoomForm';

export function CreatePage({
  onCreate,
}: {
  onCreate: (input: {
    title: string;
    nickname: string;
    startDate: string;
    endDate: string;
    goals: { title: string; icon: string; targetCount?: number }[];
  }) => { room: { inviteCode: string } };
}) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <Link to="/" className="text-xs text-slate-400 hover:text-white">
        Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white">Create room</h1>
      <p className="mt-1 text-xs text-slate-400">
        Admin only. Ikaw ang gagawa ng room at mag-send ng code sa barkada.
        Hindi ito naka-link sa landing page.
      </p>
      <div className="mt-4">
        <Card title="Room details">
          <CreateRoomForm
            onSubmit={(input) => {
              const result = onCreate(input);
              navigate(`/room/${result.room.inviteCode}`);
            }}
          />
        </Card>
      </div>
    </main>
  );
}
