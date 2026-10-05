import { useSyncExternalStore } from 'react';

/**
 * Shared hide-on-scroll state (Facebook-style header behavior).
 *
 * Both the global TopBar (App.tsx) and the RoomPage tab bar consume this
 * singleton so they hide/show in sync — no prop drilling needed.
 *
 * - Scroll down past the buffer  -> hidden (bars slide away)
 * - Any scroll up / near the top -> visible (bars slide back)
 *
 * Listener is attached once per app lifetime; emits only when the
 * boolean flips, so re-renders are cheap.
 */

let hidden = false;
let lastY = 0;
let listening = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function onScroll() {
  const y = window.scrollY;
  const delta = y - lastY;
  lastY = y;
  let next = hidden;
  if (y < 80) {
    next = false;
  } else if (delta > 8 && y > 120) {
    next = true;
  } else if (delta < -4) {
    next = false;
  }
  if (next !== hidden) {
    hidden = next;
    emit();
  }
}

function ensureListening() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  lastY = window.scrollY;
  window.addEventListener('scroll', onScroll, { passive: true });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return hidden;
}

function getServerSnapshot() {
  return false;
}

export function hideHeaderOnScroll() {
  if (hidden) return;
  hidden = true;
  emit();
}

export function showHeaderOnScroll() {
  // Re-anchor so the next scroll-down starts counting from here
  // (prevents instant re-hide right after switching tabs).
  if (typeof window !== 'undefined') lastY = window.scrollY;
  if (!hidden) return;
  hidden = false;
  emit();
}

export function useHeaderVisibility() {
  ensureListening();
  const isHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { hidden: isHidden, show: showHeaderOnScroll };
}
