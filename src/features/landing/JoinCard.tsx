import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { JoinRoomForm } from '../arc/JoinRoomForm';

export function JoinCard({
  onJoin,
}: {
  onJoin: (input: { inviteCode: string; nickname: string }) => {
    room: { inviteCode: string };
  };
}) {
  const navigate = useNavigate();

  return (
    <section id="join" className="mt-12 scroll-mt-6">
      <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 to-transparent p-1">
        <div className="rounded-2xl bg-slate-950/80 p-5">
          <Card title="Join your room">
            <p className="mb-4 text-xs text-slate-400">
              Ilagay ang code na sinend ng admin at nickname mo. Ikaw ay
              papasok bilang member.
            </p>
            <JoinRoomForm
              onSubmit={(input) => {
                const result = onJoin(input);
                navigate(`/room/${result.room.inviteCode}`);
              }}
            />
          </Card>
          <p className="mt-3 text-center text-xs text-slate-500">
            Walang code. Hingi ka muna sa admin ng room ninyo.
          </p>
        </div>
      </div>
    </section>
  );
}
