import { useEffect, useRef, useState } from 'react';
import { Camera, Link2, Trash2, X } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/Controls';
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

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open ]);

  function openEditor() {
    setUrlDraft(member.avatarUrl ?? '');
    setError('');
    setOpen(true);
  }

  function saveUrl() {
    const v = urlDraft.trim();
    if (v && !isLikelyImageUrl(v)) {
      setError('Must be a valid image URL (http/https) or upload a photo.');
      return;
    }
    try {
      onSave(v ? v : null);
      setError('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while saving.');
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
      setError(e instanceof Error ? e.message : 'Something went wrong while uploading.');
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
      setError(e instanceof Error ? e.message : 'Something went wrong while removing.');
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar nickname={member.nickname} avatarUrl={member.avatarUrl} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm text-muted">
          <span className="font-medium text-ink">{member.nickname}</span> · {member.role}
        </p>
        <button
          type="button"
          onClick={openEditor}
          className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-accent transition-colors hover:text-accent-strong"
        >
          <Camera size={14} aria-hidden="true" />
          {member.avatarUrl ? 'Change photo' : 'Add photo'}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Profile picture"
            className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-ink">Profile picture</h3>
              <IconButton label="Close" onClick={() => setOpen(false)}>
                <X size={17} aria-hidden="true" />
              </IconButton>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Avatar nickname={member.nickname} avatarUrl={member.avatarUrl} size="lg" />
              <p className="text-[13px] leading-relaxed text-muted">
                When there is no photo, a letter avatar is used by default — like Gmail when there
                is no profile photo.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label htmlFor="profile-upload" className="block text-[13px] font-medium text-muted">
                  Upload a photo
                </label>
                <input
                  ref={fileRef}
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                  className="mt-1.5 text-[13px] text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-raised file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink hover:file:border-accent/40 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="profile-url" className="block text-[13px] font-medium text-muted">
                  Or paste an image link
                </label>
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex-1">
                    <Link2
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                    />
                    <input
                      id="profile-url"
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      placeholder="https://..."
                      inputMode="url"
                      className="w-full rounded-lg border border-line bg-base py-2.5 pr-3 pl-9 text-sm text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={saveUrl} className="min-h-[42px]">
                    Save
                  </Button>
                </div>
              </div>
              {member.avatarUrl && (
                <button
                  type="button"
                  onClick={remove}
                  className="inline-flex w-fit items-center gap-1.5 text-[13px] text-danger transition-colors hover:text-red-300"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Remove photo
                </button>
              )}
              {busy && <p className="text-[13px] text-muted">Processing image...</p>}
              {error && <p className="text-[13px] text-danger">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
