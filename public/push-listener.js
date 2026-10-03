/* Winter Arc — background push listener (Layer 2).
 * Loaded into the PWA service worker via workbox.importScripts (see vite.config.ts).
 * Payload shape from supabase/functions/send-daily-reminders: { title, body, url }
 * Keep this file dependency-free (plain service-worker JS, no imports).
 */

self.addEventListener('push', (event) => {
  let data = { title: 'Winter Arc', body: 'You still have goals left today.', url: '/' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      /* keep defaults */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'winterarc-daily',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of windows) {
        try {
          if ('focus' in w) await w.focus();
          if ('navigate' in w && w.navigate) {
            await w.navigate(url);
            return;
          }
        } catch {
          /* fall through to openWindow */
        }
      }
      try {
        await self.clients.openWindow(url);
      } catch {
        /* noop */
      }
    })(),
  );
});
