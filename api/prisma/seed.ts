import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

// --- Safety: never seed anything but a local database. ---
const connectionString = process.env.DATABASE_URL;
if (!connectionString || !connectionString.includes('localhost')) {
  throw new Error(
    `Refusing to seed: DATABASE_URL must point at localhost (got: ${
      connectionString ?? 'undefined'
    }).`,
  );
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PASSWORD = 'arena123';
const now = Date.now();

type MatchSpec = [number, number, number, number, 'A' | 'B'];

async function wipe() {
  await prisma.groupHighlight.deleteMany();
  await prisma.platformTrendingPlayer.deleteMany();
  await prisma.groupHomeSummary.deleteMany();
  await prisma.rankingMovement.deleteMany();
  await prisma.matchRankingSnapshot.deleteMany();
  await prisma.feedItem.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.processingJob.deleteMany();
  await prisma.match.deleteMany();
  await prisma.groupMemberStats.deleteMany();
  await prisma.groupRankingProjection.deleteMany();
  await prisma.groupInvite.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(
  passwordHash: string,
  firstName: string,
  lastName: string,
) {
  const email = `${firstName.toLowerCase()}@arena.test`;
  return prisma.user.create({
    data: { firstName, lastName, email, passwordHash },
  });
}

async function createGroupWithMembers(
  name: string,
  members: Array<{ id: string }>,
) {
  const group = await prisma.group.create({
    data: { name, createdById: members[0].id },
  });
  const groupMemberIds: string[] = [];
  for (let index = 0; index < members.length; index += 1) {
    const member = await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: members[index].id,
        role: index === 0 ? 'ADMIN' : 'MEMBER',
      },
    });
    groupMemberIds.push(member.id);
  }
  return { groupId: group.id, groupMemberIds };
}

async function runMatches(
  groupId: string,
  gm: string[],
  specs: MatchSpec[],
) {
  for (let index = 0; index < specs.length; index += 1) {
    const [a0, a1, b0, b1, winner] = specs[index];
    const hoursAgo = (specs.length - index) * 10;
    const playedAt = new Date(now - hoursAgo * 60 * 60 * 1000);
    const match = await prisma.match.create({
      data: {
        groupId,
        gamesA: winner === 'A' ? 6 : 3,
        gamesB: winner === 'A' ? 3 : 6,
        winnerTeam: winner === 'A' ? 'TEAM_A' : 'TEAM_B',
        processingStatus: 'PENDING',
        playedAt,
        createdAt: playedAt,
      },
    });
    await prisma.matchPlayer.createMany({
      data: [
        [gm[a0], 'TEAM_A', 1],
        [gm[a1], 'TEAM_A', 2],
        [gm[b0], 'TEAM_B', 1],
        [gm[b1], 'TEAM_B', 2],
      ].map(([groupMemberId, team, position]) => ({
        matchId: match.id,
        groupId,
        groupMemberId: groupMemberId as string,
        team: team as 'TEAM_A' | 'TEAM_B',
        position: position as number,
        ratingBefore: 1000,
        ratingAfter: 1000,
        ratingDelta: 0,
        playedAt,
      })),
    });
  }
}

async function main() {
  await wipe();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Group A — "Quinta-feira": 0 leo, 1 ana, 2 rui, 3 bia, 4 caio, 5 duda, 6 eva, 7 gus
  const groupAUsers = await Promise.all(
    [
      ['Leo', 'Martins'],
      ['Ana', 'Costa'],
      ['Rui', 'Dias'],
      ['Bia', 'Nunes'],
      ['Caio', 'Reis'],
      ['Duda', 'Lima'],
      ['Eva', 'Pinto'],
      ['Gus', 'Alves'],
    ].map(([first, last]) => createUser(passwordHash, first, last)),
  );
  const groupA = await createGroupWithMembers('Quinta-feira', groupAUsers);

  // leo dominates early (→ leader / record), bia loses then wins late (climb→streak),
  // ana ends on a long unbeaten run, caio plays 10 matches (→ matches milestone).
  const A_MATCHES: MatchSpec[] = [
    [0, 2, 4, 5, 'A'],
    [0, 3, 4, 6, 'A'],
    [0, 5, 4, 7, 'A'],
    [0, 6, 2, 4, 'A'],
    [0, 7, 3, 4, 'A'],
    [0, 1, 4, 5, 'A'],
    [0, 2, 4, 6, 'A'],
    [0, 3, 4, 7, 'A'],
    [1, 3, 4, 5, 'A'],
    [1, 3, 2, 6, 'A'],
    [1, 3, 4, 7, 'A'],
    [1, 3, 5, 6, 'A'],
    [1, 3, 2, 7, 'A'],
  ];
  await runMatches(groupA.groupId, groupA.groupMemberIds, A_MATCHES);

  // Group B — "Praia Norte": 0 tom, 1 nina, 2 ze, 3 lia, 4 pedro, 5 sol
  const groupBUsers = await Promise.all(
    [
      ['Tom', 'Faria'],
      ['Nina', 'Rocha'],
      ['Ze', 'Maia'],
      ['Lia', 'Castro'],
      ['Pedro', 'Sa'],
      ['Sol', 'Vidal'],
    ].map(([first, last]) => createUser(passwordHash, first, last)),
  );
  const groupB = await createGroupWithMembers('Praia Norte', groupBUsers);

  // tom dominates (→ leader / record); nina ends on a long run (→ Arena-worthy streak).
  const B_MATCHES: MatchSpec[] = [
    [0, 2, 3, 4, 'A'],
    [0, 3, 4, 5, 'A'],
    [0, 1, 3, 4, 'A'],
    [0, 2, 4, 5, 'A'],
    [0, 4, 1, 3, 'A'],
    [0, 5, 2, 3, 'A'],
    [0, 1, 4, 5, 'A'],
    [0, 2, 3, 5, 'A'],
    [1, 2, 3, 4, 'A'],
    [1, 2, 4, 5, 'A'],
    [1, 2, 3, 5, 'A'],
    [1, 3, 4, 5, 'A'],
    [1, 3, 2, 4, 'A'],
  ];
  await runMatches(groupB.groupId, groupB.groupMemberIds, B_MATCHES);

  // Enqueue a full rebuild per group — the worker runs the whole cascade (ratings →
  // rankings → stats → highlights) when the API is up.
  for (const groupId of [groupA.groupId, groupB.groupId]) {
    await prisma.processingJob.create({
      data: { type: 'GROUP_RANKING_REBUILD', scope: 'GROUP', groupId },
    });
  }

  console.log('Seed complete.');
  console.log(`  Users: ${groupAUsers.length + groupBUsers.length} (password: ${PASSWORD})`);
  console.log('  Groups: Quinta-feira (8), Praia Norte (6)');
  console.log('  Log in as gus@arena.test to see Group A people + Arena backfill.');
  console.log('  Start the API so the worker processes the rebuild jobs.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
