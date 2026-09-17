import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { JoinRoomForm } from '../features/arc/JoinRoomForm';

export function JoinPage({
  onJoin,
}: {
  onJoin: (input: { inviteCode: string; nickname: string }) => {
    room: { inviteCode: string };
  };
}) {
  const navigate = useNavigate();
  const { code } = useParams();
  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <Link to="/" className="text-xs text-slate-400 hover:text-white">
        Back
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-white">Join room</h1>
      <div className="mt-4">
        <Card title="Enter code">
          <JoinRoomForm
            initialCode={code ?? ''}
            onSubmit={(input) => {
              const result = onJoin(input);
              navigate(`/room/${result.room.inviteCode}`);
            }}
          />
        </Card>
      </div>
    </main>
  );
}
