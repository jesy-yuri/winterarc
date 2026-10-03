// Supabase Edge Function: send-daily-reminders (Layer 2 — true background push)
// Deploy: supabase functions deploy send-daily-reminders
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com)
// Schedule: Supabase Dashboard > Edge Functions > send-daily-reminders > Schedule
//   e.g. every day 12:00 UTC (= 8PM PHT) — cron: 0 12 * * *
//
// What it does (per subscribed member):
//   1. Read push_subscriptions + member's room.
//   2. Count today's check_ins vs total items (goals + active personal + enabled workouts).
//   3. Compute lenient streak (same rule as calcStreak in src/lib/localStore.ts).
//   4. If may kulang pa -> web-push send with streak-at-risk copy.
//
// NOTE: npm package used here is `web-push`. Add via `deno add npm:web-push`
// or import map. Service role key required (SUPABASE_SERVICE_ROLE_KEY is
// auto-provided to Edge Functions).

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

function todayKey(d = new Date()): string {
  // NOTE: Edge Functions run in UTC — for PHT, shift +8h before calling.
  const pht = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const y = pht.getUTCFullYear();
  const m = `${pht.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${pht.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!set.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  const toKey = (d: Date) =>
    `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, '0')}-${`${d.getUTCDate()}`.padStart(2, '0')}`;
  while (set.has(toKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

Deno.serve(async () => {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return new Response('Missing VAPID keys', { status: 500 });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const today = todayKey(new Date());

    const { data: subs, error } = await supabase.from('push_subscriptions').select(
      'id, member_id, endpoint, p256dh, auth',
    );
    if (error) return new Response(error.message, { status: 500 });

    let sent = 0;
    for (const sub of subs ?? []) {
      const { data: member } = await supabase
        .from('members')
        .select('id, room_id')
        .eq('id', sub.member_id)
        .maybeSingle();
      if (!member) continue;

      const [{ data: goals }, { data: personals }, { data: plans }, { data: checkIns }] =
        await Promise.all([
          supabase.from('goals').select('id').eq('room_id', member.room_id),
          supabase.from('personal_goals').select('id').eq('member_id', member.id).eq('is_active', true),
          supabase.from('workout_plans').select('selections').eq('room_id', member.room_id).eq(
            'member_id',
            member.id,
          ).maybeSingle(),
          supabase.from('check_ins').select('goal_id, date').eq('member_id', member.id).eq(
            'room_id',
            member.room_id,
          ),
        ]);

      const enabledWorkouts =
        (plans?.selections as { included?: boolean }[] | null)?.filter((s) => s.included).length ?? 0;
      const total = (goals?.length ?? 0) + (personals?.length ?? 0) + enabledWorkouts;
      const doneToday = (checkIns ?? []).filter((c) => c.date === today).length;
      const remaining = total - doneToday;
      if (total === 0 || remaining <= 0) continue;

      const dates = [...new Set((checkIns ?? []).map((c) => c.date as string))];
      const streak = calcStreak(dates, today);

      const { data: room } = await supabase.from('rooms').select('invite_code').eq(
        'id',
        member.room_id,
      ).maybeSingle();

      const payload = JSON.stringify({
        title: streak > 0 ? `🔥 ${streak}-day streak mo at risk!` : `Today's goal: ${remaining}/${total} pa 💪`,
        body: streak > 0
          ? `Habol na — ${remaining}/${total} goals pa today. Check in para hindi maputol.`
          : `${remaining}/${total} goals pa today. Tap para mag-check in.`,
        url: room ? `/room/${room.invite_code}` : '/',
      });

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent += 1;
      } catch {
        // Subscription expired (410) — prune it.
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }

    return Response.json({ ok: true, today, sent });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'failed', { status: 500 });
  }
});
