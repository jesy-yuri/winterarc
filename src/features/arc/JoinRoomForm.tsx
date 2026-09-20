import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function JoinRoomForm({
  initialCode = '',
  onSubmit,
}: {
  initialCode?: string;
  onSubmit: (input: { inviteCode: string; nickname: string }) => void | Promise<void>;
}) {
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (!code.trim() || !nickname.trim()) {
      setError('Code and nickname are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit({ inviteCode: code, nickname });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while joining.');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Room code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        autoComplete="off"
        hint="6-letter code shared by your admin."
      />
      <Input
        label="Your name"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="e.g. Jessie"
        autoComplete="nickname"
      />
      {error && <p className="text-[13px] text-danger">{error}</p>}
      <Button type="button" onClick={submit} disabled={busy}>
        <LogIn size={16} aria-hidden="true" />
        {busy ? 'Joining…' : 'Join Room'}
      </Button>
    </div>
  );
}
