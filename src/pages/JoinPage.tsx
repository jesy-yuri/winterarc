import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { JoinRoomForm } from '../features/arc/JoinRoomForm';

export function JoinPage({
  onJoin,
}: {
  onJoin: (input: { inviteCode: string; nickname: string }) =>
    | { room: { inviteCode: string } }
    | Promise<{ room: { inviteCode: string } }>;
}) {
  const { code } = useParams();
  const navigate = useNavigate();
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-6 pb-16 sm:max-w-lg sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back
      </Link>

      <p className="mt-6 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase sm:mt-8">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        Join
      </p>
      <h1 className="mt-3 font-display text-3xl leading-[1.02] text-ink uppercase sm:text-4xl">
        Join a Winter Arc
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Enter the room code shared by your admin. No signup, no password.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <JoinRoomForm
          initialCode={code ?? ''}
          onSubmit={async (input) => {
            const result = await onJoin(input);
            navigate(`/room/${result.room.inviteCode}`);
          }}
        />
      </div>
    </main>
  );
}
