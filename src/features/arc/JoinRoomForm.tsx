import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function JoinRoomForm({
  initialCode = '',
  onSubmit,
}: {
  initialCode?: string;
  onSubmit: (input: { inviteCode: string; nickname: string }) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  function submit() {
    try {
      if (!code.trim() || !nickname.trim()) {
        setError('Kailangan ng code at nickname.');
        return;
      }
      setError('');
      onSubmit({ inviteCode: code, nickname });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'May error sa pag join.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Invite code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
      />
      <Input
        label="Nickname mo"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="e.g. Mark"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="button" onClick={submit}>
        Join room
      </Button>
    </div>
  );
}
