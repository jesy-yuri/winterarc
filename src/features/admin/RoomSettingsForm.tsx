import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Room } from '../../types';
import type { RoomSettingsInput } from '../../lib/localStore';

export function RoomSettingsForm({
  room,
  onSave,
}: {
  room: Room;
  onSave: (input: RoomSettingsInput) => void;
}) {
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description ?? '');
  const [startDate, setStartDate] = useState(room.startDate);
  const [endDate, setEndDate] = useState(room.endDate);
  const [error, setError] = useState('');
  const [savedTick, setSavedTick] = useState(false);

  function submit() {
    try {
      onSave({ title, description, startDate, endDate });
      setError('');
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while saving.');
      setSavedTick(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <Input label="Room name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <div>
          <label htmlFor="room-settings-desc" className="block text-[13px] font-medium text-muted">
            Description <span className="font-normal text-faint">(optional)</span>
          </label>
          <textarea
            id="room-settings-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={200}
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button type="button" size="sm" onClick={submit} className="w-full sm:w-auto">
            Save settings
          </Button>
          {savedTick && <span className="text-[13px] text-muted">Saved.</span>}
        </div>
      </div>
    </div>
  );
}
