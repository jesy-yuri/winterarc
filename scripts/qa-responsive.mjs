export default async function run(page, ui) {
  const BASE = 'http://localhost:4173';
  const results = [];
  function check(name, cond, extra) {
    results.push({ name, pass: Boolean(cond), extra: extra ?? null });
  }

  const seed = {
    rooms: [
      {
        id: 'r1', inviteCode: 'ABC123', title: 'BSIT 3A WinterArc',
        description: 'Test room for responsive QA.',
        startDate: '2026-09-01', endDate: '2026-12-31',
        createdAt: '2026-09-01T00:00:00.000Z', ownerMemberId: 'm1',
      },
    ],
    members: [
      { id: 'm1', roomId: 'r1', nickname: 'Jessie', role: 'owner', joinedAt: '2026-09-01T00:00:00.000Z' },
      { id: 'm2', roomId: 'r1', nickname: 'Von', role: 'admin', joinedAt: '2026-09-02T00:00:00.000Z' },
      { id: 'm3', roomId: 'r1', nickname: 'Leah', role: 'member', joinedAt: '2026-09-03T00:00:00.000Z' },
    ],
    goals: [
      { id: 'g1', roomId: 'r1', title: 'Morning Workout', icon: 'GYM', targetCount: 20 },
      { id: 'g2', roomId: 'r1', title: 'Read 10 pages', icon: 'READ' },
      { id: 'g3', roomId: 'r1', title: 'Study 1 hour', icon: 'STUDY' },
    ],
    checkIns: [
      { id: 'c1', roomId: 'r1', memberId: 'm1', goalId: 'g1', date: '2026-09-16', createdAt: '2026-09-16T00:00:00.000Z' },
      { id: 'c2', roomId: 'r1', memberId: 'm1', goalId: 'g2', date: '2026-09-16', createdAt: '2026-09-16T00:00:00.000Z' },
      { id: 'c3', roomId: 'r1', memberId: 'm1', goalId: 'g1', date: '2026-09-17', createdAt: '2026-09-17T00:00:00.000Z' },
      { id: 'c4', roomId: 'r1', memberId: 'm2', goalId: 'g1', date: '2026-09-17', createdAt: '2026-09-17T00:00:00.000Z' },
      { id: 'c5', roomId: 'r1', memberId: 'm2', goalId: 'g2', date: '2026-09-17', createdAt: '2026-09-17T00:00:00.000Z' },
      { id: 'c6', roomId: 'r1', memberId: 'm2', goalId: 'g3', date: '2026-09-17', createdAt: '2026-09-17T00:00:00.000Z' },
    ],
    announcements: [
      { id: 'a1', roomId: 'r1', authorMemberId: 'm1', body: 'Welcome to the room. Tuloy tuloy lang.', createdAt: '2026-09-16T00:00:00.000Z' },
    ],
    currentMemberByRoom: { r1: 'm1' },
    workoutPlans: [
      {
        id: 'w1', roomId: 'r1', memberId: 'm1', updatedAt: '2026-09-17T00:00:00.000Z',
        selections: [
          { exerciseId: 'push-ups', included: true, targetCount: 50 },
          { exerciseId: 'curl-ups', included: false, targetCount: 20 },
          { exerciseId: 'jumping-jacks', included: true, targetCount: 30 },
          { exerciseId: 'squats', included: false, targetCount: 30 },
          { exerciseId: 'lunges', included: false, targetCount: 20 },
          { exerciseId: 'burpees', included: false, targetCount: 10 },
          { exerciseId: 'plank', included: false, targetCount: 30 },
          { exerciseId: 'pull-ups', included: false, targetCount: 10 },
        ],
      },
    ],
    personalGoals: [
      { id: 'p1', memberId: 'm1', title: 'Practice coding', description: '1 hour', isActive: true, createdAt: '2026-09-16T00:00:00.000Z' },
    ],
    challenges: [
      { id: 'ch1', roomId: 'r1', title: '7-Day Discipline Challenge', description: 'One week straight.', startDate: '2026-09-15', endDate: '2026-09-21', createdByMemberId: 'm1', createdAt: '2026-09-15T00:00:00.000Z' },
    ],
    challengeJoins: [
      { id: 'j1', challengeId: 'ch1', memberId: 'm1', joinedAt: '2026-09-15T00:00:00.000Z' },
      { id: 'j2', challengeId: 'ch1', memberId: 'm2', joinedAt: '2026-09-15T00:00:00.000Z' },
    ],
    reflections: [],
    achievementUnlocks: [],
    platform: { systemAdminMemberIds: ['m1'] },
  };

  async function overflowAt(width, height, path) {
    await page.setViewportSize({ width, height });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      title: document.title,
      bodyChars: document.body ? document.body.innerText.length : 0,
    }));
    return r;
  }

  const widths = [360, 390, 768, 1024, 1280, 1440, 1920];
  for (const w of widths) {
    const r = await overflowAt(w, 900, '/room/ABC123');
    check(`room no-h-overflow @${w}px`, r.scrollW <= r.innerW + 1, `scrollW=${r.scrollW} innerW=${r.innerW} chars=${r.bodyChars}`);
  }

  for (const [path, label] of [['/', 'landing'], ['/create', 'create'], ['/join/ABC123', 'join'], ['/admin', 'platform-admin']]) {
    for (const w of [390, 1280]) {
      const r = await overflowAt(w, 900, path);
      check(`${label} no-h-overflow @${w}px`, r.scrollW <= r.innerW + 1, `scrollW=${r.scrollW} innerW=${r.innerW} chars=${r.bodyChars}`);
    }
  }

  // Seed app data, then exercise every tab at desktop + mobile widths.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate((s) => localStorage.setItem('winterarc:local:v1', s), JSON.stringify(seed));
  await page.goto(BASE + '/room/ABC123', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  for (const tab of ['Today', 'Progress', 'Challenges', 'Leaderboard', 'Announcements', 'Admin']) {
    await page.getByRole('button', { name: tab }).first().click();
    await page.waitForTimeout(300);
    for (const w of [390, 1440]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        innerW: window.innerWidth,
      }));
      check(`tab ${tab} no-h-overflow @${w}px`, r.scrollW <= r.innerW + 1, `scrollW=${r.scrollW} innerW=${r.innerW}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  }

  // Sidebar visible on desktop, tab bar hidden; inverse on mobile.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(250);
  const desktopNav = await page.evaluate(() => {
    const asides = document.querySelectorAll('aside');
    const mobileNavs = [...document.querySelectorAll('nav')].filter((n) =>
      n.getAttribute('aria-label') === 'Room sections' && n.classList.contains('lg:hidden'),
    );
    return {
      asideVisible: [...asides].some((a) => a.getClientRects().length > 0),
      mobileNavHidden: mobileNavs.every((n) => n.getClientRects().length === 0),
    };
  });
  check('desktop sidebar visible', desktopNav.asideVisible);
  check('desktop mobile-tabbar hidden', desktopNav.mobileNavHidden);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const mobileNav = await page.evaluate(() => {
    const asides = document.querySelectorAll('aside');
    const mobileNavs = [...document.querySelectorAll('nav')].filter((n) =>
      n.getAttribute('aria-label') === 'Room sections' && n.classList.contains('lg:hidden'),
    );
    return {
      asideHidden: [...asides].every((a) => a.getClientRects().length === 0),
      mobileNavVisible: mobileNavs.some((n) => n.getClientRects().length > 0),
    };
  });
  check('mobile sidebar hidden', mobileNav.asideHidden);
  check('mobile tabbar visible', mobileNav.mobileNavVisible);

  // Console errors captured by runner are reported automatically; also check page errors here.
  check('no page errors during tab tour', errors.length === 0, errors.slice(0, 3).join(' | '));

  const failed = results.filter((r) => !r.pass);
  return { failedCount: failed.length, results };
}
