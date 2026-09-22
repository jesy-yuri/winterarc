import { useNavigate } from 'react-router-dom';
import { JoinRoomForm } from '../arc/JoinRoomForm';

export function JoinCard({
  onJoin,
}: {
  onJoin: (input: { inviteCode: string; nickname: string }) =>
    | { room: { inviteCode: string } }
    | Promise<{ room: { inviteCode: string } }>;
}) {
  const navigate = useNavigate();

  return (
    <section id="join" className="mt-12 scroll-mt-6 sm:mt-16 lg:mt-20" aria-labelledby="join-heading">
      <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-5 sm:p-6 lg:p-8">
        <p
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -bottom-5 hidden font-display text-8xl leading-none text-ink/[0.05] uppercase select-none sm:block"
        >
          Join
        </p>
        <p className="inline-block -rotate-1 bg-ink px-2.5 py-1 text-xs font-bold tracking-[0.18em] text-base uppercase">
          Start here
        </p>
        <h2 id="join-heading" className="mt-3 font-display text-3xl leading-[1.02] text-ink uppercase sm:text-4xl">
          Join your room
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          Enter the code shared by your admin and your nickname. You'll join as a member.
        </p>
        <div className="mt-6 max-w-md">
          <JoinRoomForm
            onSubmit={async (input) => {
              const result = await onJoin(input);
              navigate(`/room/${result.room.inviteCode}`);
            }}
          />
        </div>
      </div>
      <p className="mt-4 text-[13px] text-faint">
        No code? Ask your room admin for one first.
      </p>
    </section>
  );
}
