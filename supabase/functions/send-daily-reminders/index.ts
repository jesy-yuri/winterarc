// Supabase Edge Function: send-daily-reminders (Layer 2 — true background push)
// Deploy: supabase functions deploy send-daily-reminders
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com)
// Schedule: Supabase Dashboard > Edge Functions > send-daily-reminders > Schedule
//   e.g. every day 12:00 UTC (= 8PM PHT) — cron: 0 12 * * *
//
// What it does (per subscribed member):
//   1. Read push_subscriptions + member's room.
//   2. Count today's check_ins vs total items (goals + active personal + enabled workouts).
//   3. Compute 3-day grace streak (same rule as getStreakState in src/lib/streak.ts).
//   4. If anything remains -> web-push send with Continue-streak copy.
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

const STREAK_GRACE_DAYS = 3;

function diffDays(aKey: string, bKey: string): number | null {
  const a = new Date(`${aKey}T00:00:00Z`).getTime();
  const b = new Date(`${bKey}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

function getStreakState(dates: string[], today: string): { streak: number; status: string; daysLeft: number } {
  const set = new Set(dates.filter((d) => d <= today));
  if (set.size === 0) return { streak: 0, status: 'broken', daysLeft: 0 };
  let lastActive: string | null = null;
  for (const d of set) {
    if (lastActive === null || d > lastActive) lastActive = d;
  }
  if (!lastActive) return { streak: 0, status: 'broken', daysLeft: 0 };
  const gap = diffDays(lastActive, today);
  if (gap == null || gap >= STREAK_GRACE_DAYS) return { streak: 0, status: 'broken', daysLeft: 0 };
  // Frozen run with grace: count active days backwards, tolerate 1-2 missed days.
  const sorted = [...set].filter((d) => d <= (lastActive as string)).sort();
  let streak = 0;
  let prev: string | null = null;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const cur = sorted[i];
    if (prev === null) {
      if (cur !== lastActive) break;
      streak = 1;
    } else {
      const g = diffDays(cur, prev);
      if (g == null || g <= 0) continue;
      if (g >= STREAK_GRACE_DAYS + 1) break;
      streak += 1;
    }
    prev = cur;
  }
  const status = gap === 0 ? 'active' : gap === 1 ? 'at-risk' : 'critical';
  return { streak, status, daysLeft: STREAK_GRACE_DAYS - gap };
}

function calcStreak(dates: string[], today: string): number {
  return getStreakState(dates, today).streak;
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
      const state = getStreakState(dates, today);
      const streak = state.streak;

      const { data: room } = await supabase.from('rooms').select('invite_code').eq(
        'id',
        member.room_id,
      ).maybeSingle();

      const title = streak > 0 && (state.status === 'at-risk' || state.status === 'critical')
        ? state.status === 'critical'
          ? `Last chance! Your ${streak}-day streak resets today`
          : `Continue your ${streak}-day streak — ${state.daysLeft} days left`
        : streak > 0
          ? `Your ${streak}-day streak is at risk`
          : `Today's goals: ${remaining} of ${total} remaining`;
      const payload = JSON.stringify({
        title,
        body: streak > 0
          ? `You still have ${remaining} of ${total} goals left today. Check in to reach ${streak + 1} days.`
          : `${remaining} of ${total} goals left today. Select a goal to check in.`,
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
