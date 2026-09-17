import { useRef, useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { isLikelyImageUrl, processImageFile } from '../../lib/avatar';
import type { Member } from '../../types';

export function ProfilePictureEditor({
  member,
  onSave,
}: {
  member: Member;
  onSave: (avatarUrl: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(member.avatarUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function saveUrl() {
    const v = urlDraft.trim();
    if (v && !isLikelyImageUrl(v)) {
      setError('Dapat valid image URL (http/https) o i-upload ang pic.');
      return;
    }
    try {
      onSave(v ? v : null);
      setError('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'May error sa pag save.');
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const dataUrl = await processImageFile(file);
      onSave(dataUrl);
      setUrlDraft(dataUrl);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'May error sa pag upload.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function remove() {
    try {
      onSave(null);
      setUrlDraft('');
      setError('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'May error sa pag remove.');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar nickname={member.nickname} avatarUrl={member.avatarUrl} size="md" />
      <div className="flex flex-col">
        <p className="text-xs text-slate-400">
          Ikaw si <span className="font-medium text-white">{member.nickname}</span> ({member.role})
        </p>
        <button
          type="button"
          onClick={() => {
            setUrlDraft(member.avatarUrl ?? '');
            setError('');
            setOpen((v) => !v);
          }}
          className="mt-0.5 w-fit text-xs text-sky-400 hover:text-sky-300"
        >
          {member.avatarUrl ? 'Palit profile pic' : 'Lagay profile pic'}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Profile picture</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Avatar nickname={member.nickname} avatarUrl={member.avatarUrl} size="lg" />
              <p className="text-[11px] leading-relaxed text-slate-400">
                Kapag walang pic, letter avatar ang default (tulad ng Gmail kapag walang photo).
                Kapag nag Google login ka balang-araw, Gmail pic mo ang magiging default.
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={(e) => void handleFile(e.target.files?.[0])}
                className="text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-sky-400 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <input
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="O mag-paste ng image URL..."
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveUrl}
                  className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400"
                >
                  Save
                </button>
              </div>
              {member.avatarUrl && (
                <button
                  type="button"
                  onClick={remove}
                  className="w-fit text-xs text-red-400 hover:text-red-300"
                >
                  Remove pic (balik sa default)
                </button>
              )}
              {busy && <p className="text-xs text-slate-400">Pino-process ang image...</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
