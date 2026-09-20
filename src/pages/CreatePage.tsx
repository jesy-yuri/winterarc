import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CreateRoomForm } from '../features/arc/CreateRoomForm';

export function CreatePage({
  onCreate,
}: {
  onCreate: (input: {
    title: string;
    nickname: string;
    description?: string;
    startDate: string;
    endDate: string;
    goals: { title: string; icon: string; targetCount?: number }[];
  }) => { room: { inviteCode: string } };
}) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-6 pb-16 sm:px-6 md:max-w-2xl lg:max-w-2xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back
      </Link>

      <p className="mt-6 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase sm:mt-8">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        Admin setup
      </p>
      <h1 className="mt-3 font-display text-3xl leading-[1.02] text-ink uppercase sm:text-4xl">
        Create your Winter Arc
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        You will create the room and send the code to your friends. This is separate from the
        landing page — only people with your code can join.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:mt-8 sm:p-6 lg:p-7">
        <CreateRoomForm
          onSubmit={(input) => {
            const result = onCreate(input);
            navigate(`/room/${result.room.inviteCode}`);
          }}
        />
      </div>
    </main>
  );
}
