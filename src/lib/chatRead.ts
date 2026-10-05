/**
 * Chat unread tracking — frontend only, no backend changes.
 *
 * Remembers the newest message the user has seen per room+member in
 * localStorage. Anything from other members newer than that gets a red dot
 * on the Chat tab.
 */

import type { ChatMessage } from '../types';

const STORAGE_KEY = 'winterarc:chat-read:v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function mapKey(roomId: string, memberId: string): string {
  return `${roomId}:${memberId}`;
}

function loadMap(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch {
    return {};
  }
}

/** ISO timestamp of the newest seen message, or null when never opened. */
export function getLastReadAt(roomId: string, memberId: string): string | null {
  const v = loadMap()[mapKey(roomId, memberId)];
  return typeof v === 'string' && v ? v : null;
}

/** Mark the chat as read up to the newest message in `messages`. */
export function markChatRead(roomId: string, memberId: string, messages: ChatMessage[]): void {
  if (!isBrowser() || messages.length === 0) return;
  let latest = '';
  for (const m of messages) {
    if (m.createdAt > latest) latest = m.createdAt;
  }
  if (!latest) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadMap(), [mapKey(roomId, memberId)]: latest }));
  } catch {
    // Storage full / private mode — dot just won't persist.
  }
}

/**
 * True when another member posted something newer than the last read point.
 * Own messages never trigger the dot.
 */
export function hasUnreadChat(
  messages: ChatMessage[],
  currentMemberId: string | undefined,
  lastReadAt: string | null,
): boolean {
  if (!currentMemberId || messages.length === 0) return false;
  for (const m of messages) {
    if (m.memberId === currentMemberId) continue;
    if (lastReadAt == null) return true;
    if (m.createdAt > lastReadAt) return true;
  }
  return false;
}
