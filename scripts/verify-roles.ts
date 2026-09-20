// Throwaway verification script (not part of the app bundle).
// Run: node --experimental-strip-types scripts/verify-roles.ts
const store: Record<string, string> = {};
// @ts-ignore minimal browser stubs for the store module
globalThis.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};
// @ts-ignore
const _nodeCrypto = await import('node:crypto');
void _nodeCrypto;

const ls = await (async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.join(process.cwd(), 'scripts', '.tmp-verify');
  fs.mkdirSync(dir, { recursive: true });
  const w = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'workouts.ts'), 'utf8');
  const l = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'localStore.ts'), 'utf8');
  fs.writeFileSync(path.join(dir, 'workouts.ts'), w);
  fs.writeFileSync(path.join(dir, 'localStore.ts'), l.replaceAll("from './workouts'", "from './workouts.ts'"));
  return import('./.tmp-verify/localStore.ts');
})();

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`PASS ${name}`); }
  else { fail += 1; console.log(`FAIL ${name}`); }
}
function throws(name: string, fn: () => void) {
  try { fn(); fail += 1; console.log(`FAIL ${name} (no throw)`); }
  catch { pass += 1; console.log(`PASS ${name}`); }
}

let s = ls.loadStore();

// 1. Create room -> creator is owner
let r = ls.createRoom(s, { title: 'BSIT 3A', nickname: 'Jessie', startDate: '2026-01-01', endDate: '2026-12-31', goals: [] });
s = r.store;
const owner = r.member;
ok('creator role is owner', owner.role === 'owner');
ok('room.ownerMemberId set', r.room.ownerMemberId === owner.id);
ok('platform seeded to oldest member', s.platform.systemAdminMemberIds.includes(owner.id));

// 2. Join -> member
r = ls.joinRoom(s, { inviteCode: r.room.inviteCode, nickname: 'Leah' });
s = r.store;
const leah = r.member;
ok('joiner role is member', leah.role === 'member');
const before = s.members.length;
r = ls.joinRoom(s, { inviteCode: r.room.inviteCode, nickname: 'leah' });
s = r.store;
ok('duplicate nickname reuses member', s.members.length === before);

// 3. Owner-only room settings
throws('member cannot updateRoom', () => ls.updateRoom(s, r.room.id, leah.id, { title: 'X', startDate: '2026-01-01', endDate: '2026-12-31' }));
s = ls.updateRoom(s, r.room.id, owner.id, { title: 'BSIT 3A WinterArc', description: 'desc', startDate: '2026-01-01', endDate: '2026-12-31' });
ok('owner can updateRoom', s.rooms[0].title === 'BSIT 3A WinterArc' && s.rooms[0].description === 'desc');

// 4. Promote / demote
throws('member cannot promote', () => ls.setMemberRole(s, r.room.id, leah.id, leah.id, 'admin'));
s = ls.setMemberRole(s, r.room.id, owner.id, leah.id, 'admin');
ok('owner promotes to admin', s.members.find((m) => m.id === leah.id)?.role === 'admin');
ok('promoted admin passes isAdmin', ls.isAdmin(s, r.room.id, leah.id) === true);
throws('cannot change owner role', () => ls.setMemberRole(s, r.room.id, owner.id, owner.id, 'member'));
s = ls.setMemberRole(s, r.room.id, owner.id, leah.id, 'member');
ok('owner demotes to member', s.members.find((m) => m.id === leah.id)?.role === 'member');

// 5. Announcements: member blocked, admin allowed
throws('member cannot announce', () => ls.sendAnnouncement(s, { roomId: r.room.id, authorMemberId: leah.id, body: 'hi' }));
s = ls.setMemberRole(s, r.room.id, owner.id, leah.id, 'admin');
s = ls.sendAnnouncement(s, { roomId: r.room.id, authorMemberId: leah.id, body: 'hi' });
ok('admin can announce', s.announcements.length === 1);

// 6. Admin cannot remove members; owner can
throws('admin cannot remove member', () => ls.removeRoomMember(s, r.room.id, leah.id, owner.id));
s = ls.removeRoomMember(s, r.room.id, owner.id, leah.id);
ok('owner removes member', !s.members.some((m) => m.id === leah.id));

// 7. Leave: owner with members blocked; member leaves; owner-alone deletes room
r = ls.joinRoom(s, { inviteCode: r.room.inviteCode, nickname: 'Von' });
s = r.store;
const von = r.member;
throws('owner with members cannot leave', () => ls.leaveRoom(s, r.room.id, owner.id));
s = ls.leaveRoom(s, r.room.id, von.id);
ok('member can leave', !s.members.some((m) => m.id === von.id));
const solo = ls.createRoom(s, { title: 'Solo', nickname: 'Solo', startDate: '2026-01-01', endDate: '2026-02-01', goals: [] });
s = solo.store;
s = ls.leaveRoom(s, solo.room.id, solo.member.id);
ok('owner-alone leave deletes room', !s.rooms.some((x) => x.id === solo.room.id));

// 8. Transfer ownership
r = ls.joinRoom(s, { inviteCode: r.room.inviteCode, nickname: 'Leah2' });
s = r.store;
const leah2 = r.member;
const mainRoom = s.rooms.find((x) => x.title === 'BSIT 3A WinterArc')!;
s = ls.transferOwnership(s, mainRoom.id, owner.id, leah2.id);
ok('transfer swaps roles', s.members.find((m) => m.id === leah2.id)?.role === 'owner' && s.members.find((m) => m.id === owner.id)?.role === 'admin');
ok('room.ownerMemberId updated', s.rooms.find((x) => x.id === mainRoom.id)?.ownerMemberId === leah2.id);

// 9. Challenges: member blocked, owner allowed, idempotent join
r = ls.joinRoom(s, { inviteCode: mainRoom.inviteCode, nickname: 'Kai' });
s = r.store;
const kai = r.member;
throws('member cannot create challenge', () => ls.createChallenge(s, { roomId: mainRoom.id, createdByMemberId: kai.id, title: 'x', description: '', startDate: '2026-01-01', endDate: '2026-01-08' }));
const ch = ls.createChallenge(s, { roomId: mainRoom.id, createdByMemberId: leah2.id, title: '7-Day', description: '', startDate: '2026-01-01', endDate: '2026-01-08' });
s = ch;
const chId = s.challenges[s.challenges.length - 1].id;
s = ls.joinChallenge(s, chId, leah2.id);
const joinsBefore = s.challengeJoins.length;
s = ls.joinChallenge(s, chId, leah2.id);
ok('duplicate join is idempotent', s.challengeJoins.length === joinsBefore);

// 10. Platform admin: grant/revoke, last-admin guard, delete any room
s = ls.grantPlatformAdmin(s, owner.id, leah2.id);
ok('grant platform admin', s.platform.systemAdminMemberIds.includes(leah2.id));
throws('cannot revoke last admin', () => {
  let t = ls.revokePlatformAdmin(s, owner.id, owner.id);
  t = ls.revokePlatformAdmin(t, leah2.id, leah2.id);
  void t;
});
throws('non-admin cannot grant', () => ls.grantPlatformAdmin(s, 'nope', leah2.id));
const solo2 = ls.createRoom(s, { title: 'Temp', nickname: 'Temp', startDate: '2026-01-01', endDate: '2026-02-01', goals: [] });
s = solo2.store;
throws('plain member cannot delete room', () => ls.deleteRoom(s, solo2.room.id, kai.id));
s = ls.deleteRoom(s, solo2.room.id, leah2.id);
ok('platform admin can delete any room', !s.rooms.some((x) => x.id === solo2.room.id));

// 11. Migration of legacy data
const legacy = {
  rooms: [{ id: 'r1', inviteCode: 'ABC123', title: 'Old', startDate: '2026-01-01', endDate: '2026-03-01', createdAt: '2026-01-01', adminMemberId: 'm1' }],
  members: [
    { id: 'm1', roomId: 'r1', nickname: 'Old', role: 'admin', joinedAt: '2026-01-01' },
    { id: 'm2', roomId: 'r1', nickname: 'Kid', role: 'member', joinedAt: '2026-01-02' },
  ],
  goals: [], checkIns: [], announcements: [], currentMemberByRoom: {},
};
store['winterarc:local:v1'] = JSON.stringify(legacy);
const mig = ls.loadStore();
ok('legacy adminMemberId -> ownerMemberId', mig.rooms[0].ownerMemberId === 'm1');
ok('legacy creator admin -> owner', mig.members.find((m) => m.id === 'm1')?.role === 'owner');
ok('legacy member stays member', mig.members.find((m) => m.id === 'm2')?.role === 'member');
ok('platform seeded from legacy', mig.platform.systemAdminMemberIds.includes('m1'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
