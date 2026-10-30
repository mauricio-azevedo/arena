import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AVATAR_COLOR_KEYS } from '@arena/contracts';
import {
  accountSchema,
  authSessionResponseSchema,
} from '@arena/contracts/auth';
import { passwordUpdatedResponseSchema } from '@arena/contracts/me';
import {
  groupHomeCardResponseSchema,
  groupMembershipResponseSchema,
  groupSchema,
} from '@arena/contracts/groups';
import {
  claimMembershipSchema,
  claimResultResponseSchema,
  claimStubSummarySchema,
} from '@arena/contracts/claims';
import {
  createdInviteResponseSchema,
  publicInviteResponseSchema,
} from '@arena/contracts/invites';
import {
  matchDeletedResponseSchema,
  matchResponseSchema,
  type MatchBody,
} from '@arena/contracts/matches';
import {
  groupMemberResponseSchema,
  memberProfileResponseSchema,
} from '@arena/contracts/members';
import {
  profileMatchListItemSchema,
  profileSummaryResponseSchema,
} from '@arena/contracts/profiles';
import { rankingEntrySchema } from '@arena/contracts/ranking';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ProcessingJobRunnerService } from '../src/processing/processing-job-runner.service';
import { ProcessingJobWriterService } from '../src/processing/processing-job-writer.service';

async function waitFor(
  condition: () => Promise<boolean>,
  description: string,
  timeoutMs: number,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await condition()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for ${description}`);
}

// Ratings, ranks and partner stats are projected by the job a match write
// enqueues, which the worker picks up as soon as the write commits. Reads of
// them wait for the match instead of racing the queue, on a budget tight
// enough to fail if that hand-off ever goes back to waiting for a clock. A
// second write on the match waits too: the first job marks the match processed
// unconditionally, so left in flight it could publish the old result over the
// new write.
async function waitUntilProcessed(
  app: INestApplication<App>,
  groupId: string,
  matchId: string,
) {
  await waitFor(
    async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/matches/${matchId}`)
        .expect(200);

      return (
        matchResponseSchema.parse(res.body).processingStatus === 'PROCESSED'
      );
    },
    `match ${matchId} to be processed`,
    2_000,
  );
}

function waitUntilQueueQuiet(prisma: PrismaService) {
  return waitFor(
    async () =>
      (await prisma.processingJob.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      })) === 0,
    'the queue to go quiet',
    10_000,
  );
}

function waitUntilJobStatus(
  prisma: PrismaService,
  jobId: string,
  status: 'DONE' | 'FAILED',
) {
  return waitFor(
    async () =>
      (await prisma.processingJob.findUniqueOrThrow({ where: { id: jobId } }))
        .status === status,
    `job ${jobId} to be ${status}`,
    5_000,
  );
}

function waitUntilJobAttempt(
  prisma: PrismaService,
  jobId: string,
  attemptCount: number,
) {
  return waitFor(
    async () =>
      (await prisma.processingJob.findUniqueOrThrow({ where: { id: jobId } }))
        .attemptCount >= attemptCount,
    `job ${jobId} to reach attempt ${attemptCount}`,
    8_000,
  );
}

// The full module graph boots against a real database. Unit specs mock Prisma;
// this is the one place the wiring itself is exercised, and where each
// response is parsed with its contract: the schemas are strict, so a field the
// API sends without promising it fails here, not in the web app.
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health answers 200 { status: "ok" }', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  describe('match flow', () => {
    let token: string;
    let email: string;
    let userId: string;
    let groupId: string;
    let matchId: string;
    let biaMemberId: string;
    let matchBody: MatchBody;

    beforeAll(async () => {
      // Unique per run: the database outlives the test locally.
      email = `e2e-${Date.now()}@arena.test`;
      const register = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'E2E',
          lastName: 'Runner',
          email,
          password: 'secret1',
        })
        .expect(201);
      const registered = authSessionResponseSchema.parse(register.body);
      token = registered.accessToken;
      userId = registered.user.id;

      const group = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E group' })
        .expect(201);
      groupId = groupSchema.parse(group.body).id;

      // The registered user plays from the creator's seat, so the profile routes
      // answer with a real match, partner and rank; the other three are guests.
      const members = await request(app.getHttpServer())
        .get(`/groups/${groupId}/members`)
        .expect(200);
      const creator = groupMemberResponseSchema
        .array()
        .parse(members.body)
        .find((member) => member.userId === userId);

      if (!creator) {
        throw new Error('The group creator is not listed as a member');
      }

      matchBody = {
        teamAPlayer1: { memberId: creator.id },
        teamAPlayer2: { name: 'Bia' },
        teamBPlayer1: { name: 'Caio' },
        teamBPlayer2: { name: 'Davi' },
        gamesA: 6,
        gamesB: 3,
      };
    });

    it('POST /groups/:groupId/matches answers the match contract', async () => {
      const res = await request(app.getHttpServer())
        .post(`/groups/${groupId}/matches`)
        .set('Authorization', `Bearer ${token}`)
        .send(matchBody)
        .expect(201);

      const match = matchResponseSchema.parse(res.body);
      matchId = match.id;
      expect(match.winnerTeam).toBe('TEAM_A');
      // Ordered by team, then position, as promised: the slots the body named
      // are the indexes below.
      expect(
        match.players.map((player) => `${player.team}:${player.position}`),
      ).toEqual(['TEAM_A:1', 'TEAM_A:2', 'TEAM_B:1', 'TEAM_B:2']);

      // The update below keeps these four by id: a name on an update adds a
      // new guest, as on create.
      const [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2] =
        match.players.map((player) => ({ memberId: player.groupMemberId }));
      matchBody = {
        ...matchBody,
        teamAPlayer1,
        teamAPlayer2,
        teamBPlayer1,
        teamBPlayer2,
      };
      // The creator's partner, a stub: the member profile runs on her.
      biaMemberId = teamAPlayer2.memberId;
    });

    it('GET /groups/:groupId/matches answers a list of the match contract', async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/matches`)
        .expect(200);

      const matches = matchResponseSchema.array().parse(res.body);
      expect(matches.map((match) => match.id)).toEqual([matchId]);
    });

    it('GET /groups/:groupId/matches/:id answers the match contract', async () => {
      const res = await request(app.getHttpServer())
        .get(`/groups/${groupId}/matches/${matchId}`)
        .expect(200);

      expect(matchResponseSchema.parse(res.body).id).toBe(matchId);
    });

    it('PATCH /groups/:groupId/matches/:id answers the match contract', async () => {
      // On the processed match, so the update's job is the only one in flight.
      await waitUntilProcessed(app, groupId, matchId);

      const res = await request(app.getHttpServer())
        .patch(`/groups/${groupId}/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...matchBody, gamesA: 2, gamesB: 6 })
        .expect(200);

      expect(matchResponseSchema.parse(res.body).winnerTeam).toBe('TEAM_B');
    }, 20_000);

    // Same shapes behind /me (own profile, email included) and /users/:userId
    // (anyone's, email withheld). Runs on the processed match so stats,
    // partners and ranks are populated, not their empty defaults.
    describe('profile', () => {
      beforeAll(async () => {
        await waitUntilProcessed(app, groupId, matchId);
      }, 20_000);

      it('GET /me/profile/summary answers the summary contract with the email', async () => {
        const res = await request(app.getHttpServer())
          .get('/me/profile/summary')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const summary = profileSummaryResponseSchema.parse(res.body);
        expect(summary.user.email).toBe(email);
        expect(summary.stats.matchesPlayed).toBe(1);
        expect(summary.bestPartner?.displayName).toBe('Bia');
        expect(summary.recentMatches.map((match) => match.id)).toEqual([
          matchId,
        ]);
        expect(summary.recentGroups.map((group) => group.id)).toEqual([
          groupId,
        ]);
        expect(summary.recentGroups[0].currentRank).not.toBeNull();
      });

      it('GET /me/profile/matches answers a list of the profile match contract', async () => {
        const res = await request(app.getHttpServer())
          .get('/me/profile/matches')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const matches = profileMatchListItemSchema.array().parse(res.body);
        expect(matches.map((match) => match.id)).toEqual([matchId]);
      });

      it('GET /users/:userId/profile/summary answers the summary contract without the email', async () => {
        const res = await request(app.getHttpServer())
          .get(`/users/${userId}/profile/summary`)
          .expect(200);

        const summary = profileSummaryResponseSchema.parse(res.body);
        expect(summary.user.id).toBe(userId);
        expect(summary.user.email).toBeNull();
      });

      it('GET /users/:userId/profile/matches answers a list of the profile match contract', async () => {
        const res = await request(app.getHttpServer())
          .get(`/users/${userId}/profile/matches`)
          .expect(200);

        const matches = profileMatchListItemSchema.array().parse(res.body);
        expect(matches.map((match) => match.id)).toEqual([matchId]);
      });
    });

    // Members and the ranking share the membership shape; the ranking adds the
    // projected stats and movement. Runs on the processed match so ranks, stats
    // and the creator's movement are populated, not their empty defaults. The
    // writes then take the roster through add, unlink and remove, and a
    // newcomer shows the defaults.
    describe('members and ranking', () => {
      let secondUserId: string;
      let guestMemberId: string;
      let addedMemberId: string;

      beforeAll(async () => {
        await waitUntilProcessed(app, groupId, matchId);

        // A second account for `POST …/members`: the route adds an existing
        // user, and the creator is already in.
        const register = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            firstName: 'Segunda',
            lastName: 'Conta',
            email: `e2e-${Date.now()}-b@arena.test`,
            password: 'secret1',
          })
          .expect(201);
        secondUserId = (register.body as { user: { id: string } }).user.id;
      }, 20_000);

      it('GET /groups/:groupId/ranking answers a list of the ranking entry contract', async () => {
        const res = await request(app.getHttpServer())
          .get(`/groups/${groupId}/ranking`)
          .expect(200);

        const ranking = rankingEntrySchema.array().parse(res.body);
        // Everyone started at 1000, all #1; after the one match the two winners
        // share #1 and the two losers #2, in display order.
        expect(ranking.map((entry) => entry.currentRank)).toEqual([1, 1, 2, 2]);

        const creator = ranking.find((entry) => entry.userId === userId);
        expect(creator?.stats).toEqual({ matchesCount: 1, winsCount: 0 });
        expect(creator?.rankingMovement).toMatchObject({
          direction: 'DOWN',
          positions: 1,
          previousRank: 1,
          currentRank: 2,
          sourceMatchId: matchId,
        });
      });

      it('GET /groups/:groupId/members/:memberId/profile answers the member profile contract', async () => {
        // The only profile a stub player can have: no account behind it.
        const res = await request(app.getHttpServer())
          .get(`/groups/${groupId}/members/${biaMemberId}/profile`)
          .expect(200);

        const profile = memberProfileResponseSchema.parse(res.body);
        expect(profile).toMatchObject({
          groupMemberId: biaMemberId,
          userId: null,
          displayName: 'Bia',
          avatarColor: null,
        });
        expect(profile.stats.matchesPlayed).toBe(1);
        expect(profile.matches.map((match) => match.id)).toEqual([matchId]);
      });

      it('POST /groups/:groupId/members/guest answers the member contract', async () => {
        const res = await request(app.getHttpServer())
          .post(`/groups/${groupId}/members/guest`)
          .set('Authorization', `Bearer ${token}`)
          // The schema trims: the stored name is canonical.
          .send({ name: '  Edu  ' })
          .expect(201);

        const member = groupMemberResponseSchema.parse(res.body);
        guestMemberId = member.id;
        expect(member).toMatchObject({
          userId: null,
          displayName: 'Edu',
          user: null,
          role: 'MEMBER',
          leftAt: null,
        });
      });

      it('POST /groups/:groupId/members answers the member contract', async () => {
        const res = await request(app.getHttpServer())
          .post(`/groups/${groupId}/members`)
          .set('Authorization', `Bearer ${token}`)
          .send({ userId: secondUserId })
          .expect(201);

        const member = groupMemberResponseSchema.parse(res.body);
        addedMemberId = member.id;
        expect(member.userId).toBe(secondUserId);
        expect(member.user).toMatchObject({
          firstName: 'Segunda',
          lastName: 'Conta',
        });
      });

      it('GET /groups/:groupId/members answers a list of the member contract', async () => {
        const res = await request(app.getHttpServer())
          .get(`/groups/${groupId}/members`)
          .expect(200);

        const members = groupMemberResponseSchema.array().parse(res.body);
        // The four players, the guest and the added account.
        expect(members).toHaveLength(6);
        expect(members.map((member) => member.id)).toEqual(
          expect.arrayContaining([guestMemberId, addedMemberId]),
        );
      });

      it('GET /groups/:groupId/ranking lists a member who never played with zero stats and no rank', async () => {
        const res = await request(app.getHttpServer())
          .get(`/groups/${groupId}/ranking`)
          .expect(200);

        const added = rankingEntrySchema
          .array()
          .parse(res.body)
          .find((entry) => entry.id === addedMemberId);
        // No stats row and no rank until the next processed match.
        expect(added).toMatchObject({
          rating: 1000,
          currentRank: null,
          stats: { matchesCount: 0, winsCount: 0 },
          rankingMovement: null,
        });
      });

      it('POST /groups/:groupId/members/:memberId/unlink answers the member contract as a stub', async () => {
        const res = await request(app.getHttpServer())
          .post(`/groups/${groupId}/members/${addedMemberId}/unlink`)
          .set('Authorization', `Bearer ${token}`)
          .expect(201);

        const member = groupMemberResponseSchema.parse(res.body);
        // The account is detached and its name frozen into displayName.
        expect(member).toMatchObject({
          id: addedMemberId,
          userId: null,
          user: null,
          displayName: 'Segunda Conta',
        });
      });

      it('DELETE /groups/:groupId/members/:memberId answers the member contract and drops them from the roster', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/groups/${groupId}/members/${addedMemberId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const member = groupMemberResponseSchema.parse(res.body);
        expect(member.id).toBe(addedMemberId);
        expect(member.leftAt).not.toBeNull();

        const roster = await request(app.getHttpServer())
          .get(`/groups/${groupId}/members`)
          .expect(200);
        const memberIds = groupMemberResponseSchema
          .array()
          .parse(roster.body)
          .map((entry) => entry.id);
        expect(memberIds).not.toContain(addedMemberId);
      });
    });

    // Runs on the processed match, so a home card carries a ranked standing, a
    // leader and real counts instead of their empty defaults. The three paths
    // behind the two home routes answer one shape: the viewer's groups, every
    // public group, and public suggestions for a signed-out or group-less
    // viewer.
    describe('groups', () => {
      beforeAll(async () => {
        await waitUntilProcessed(app, groupId, matchId);
        await waitUntilQueueQuiet(app.get(PrismaService));
      }, 30_000);

      it('POST /groups answers the group contract and picks a palette colour', async () => {
        const res = await request(app.getHttpServer())
          .post('/groups')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: '  E2E contract group  ', description: '   ' })
          .expect(201);

        const group = groupSchema.parse(res.body);
        // The schema trims both; an empty description is stored as null.
        expect(group).toMatchObject({
          name: 'E2E contract group',
          description: null,
          visibility: 'PUBLIC',
          createdById: userId,
        });
        expect(AVATAR_COLOR_KEYS).toContain(group.avatarColor);
      });

      it('POST /groups rejects a blank name and a colour outside the palette', async () => {
        await request(app.getHttpServer())
          .post('/groups')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: '   ' })
          .expect(400);

        await request(app.getHttpServer())
          .post('/groups')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'E2E rejected group', avatarColor: 'puce' })
          .expect(400);
      });

      it('GET /groups answers a list of the group contract', async () => {
        const res = await request(app.getHttpServer())
          .get('/groups')
          .expect(200);

        const ids = groupSchema
          .array()
          .parse(res.body)
          .map((group) => group.id);
        expect(ids).toContain(groupId);
      });

      it('GET /groups/:groupId answers the group contract', async () => {
        const res = await request(app.getHttpServer())
          .get(`/groups/${groupId}`)
          .expect(200);

        expect(groupSchema.parse(res.body).id).toBe(groupId);
      });

      it('GET /groups/home answers the home card contract for a member', async () => {
        const res = await request(app.getHttpServer())
          .get('/groups/home')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const card = groupHomeCardResponseSchema
          .array()
          .parse(res.body)
          .find((entry) => entry.group.id === groupId);

        if (!card) {
          throw new Error('The home feed is missing the group');
        }

        expect(card.relationship).toBe('MEMBER');
        expect(card.group.matchesCount).toBe(1);
        expect(card.group.membersCount).toBeGreaterThan(0);
        expect(card.group.lastMatchAt).not.toBeNull();
        expect(card.currentUser?.role).toBe('ADMIN');
        // The projection ran, so the viewer is ranked and the group has a leader.
        expect(card.currentUser?.standing.kind).toBe('RANKED');
        expect(card.leaders.length).toBeGreaterThan(0);
        expect(card.projection?.status).toBe('CURRENT');
      });

      it('GET /groups/home answers public suggestions for a signed-out viewer', async () => {
        const res = await request(app.getHttpServer())
          .get('/groups/home')
          .expect(200);

        const cards = groupHomeCardResponseSchema.array().parse(res.body);
        expect(cards.length).toBeGreaterThan(0);
        expect(
          cards.every(
            (card) =>
              card.relationship === 'PUBLIC_SUGGESTION' &&
              card.currentUser === null,
          ),
        ).toBe(true);
      });

      it('GET /groups/home/all answers the home card contract for every public group', async () => {
        const res = await request(app.getHttpServer())
          .get('/groups/home/all')
          .expect(200);

        const card = groupHomeCardResponseSchema
          .array()
          .parse(res.body)
          .find((entry) => entry.group.id === groupId);

        if (!card) {
          throw new Error('The public feed is missing the group');
        }

        // Signed out: no membership and no projection state on the card.
        expect(card).toMatchObject({
          relationship: 'PUBLIC_SUGGESTION',
          sortReason: 'PUBLIC_SUGGESTION',
          currentUser: null,
          projection: null,
        });
      });

      it('GET /me/groups answers a list of the membership contract', async () => {
        const res = await request(app.getHttpServer())
          .get('/me/groups')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const membership = groupMembershipResponseSchema
          .array()
          .parse(res.body)
          .find((entry) => entry.groupId === groupId);

        expect(membership?.role).toBe('ADMIN');
        expect(membership?.group.id).toBe(groupId);
      });

      it('GET /users/:userId/groups answers the same membership contract', async () => {
        const res = await request(app.getHttpServer())
          .get(`/users/${userId}/groups`)
          .expect(200);

        const groupIds = groupMembershipResponseSchema
          .array()
          .parse(res.body)
          .map((entry) => entry.groupId);
        expect(groupIds).toContain(groupId);
      });
    });

    // Runs on the processed match, so a claim summary carries a real record and
    // the conflict has a shared match to find. Both invite kinds, both ways in
    // (take over a guest, join as new) and the block that keeps two people from
    // becoming one account.
    describe('invites and claims', () => {
      // A guest with no matches: the claim below takes it over, and the closed
      // invite addressed to it degrades once it is gone.
      let guestMemberId: string;
      let openToken: string;
      let closedToken: string;
      let degradedToken: string;
      let claimerToken: string;
      let claimerUserId: string;
      let joinerUserId: string;

      beforeAll(async () => {
        await waitUntilProcessed(app, groupId, matchId);
        await waitUntilQueueQuiet(app.get(PrismaService));

        const guest = await request(app.getHttpServer())
          .post(`/groups/${groupId}/members/guest`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Zeca' })
          .expect(201);
        guestMemberId = groupMemberResponseSchema.parse(guest.body).id;

        const [claimer, joiner] = await Promise.all(
          ['claimer', 'joiner'].map((who) =>
            request(app.getHttpServer())
              .post('/auth/register')
              .send({
                firstName: who === 'claimer' ? 'Zeca' : 'Nova',
                lastName: 'Conta',
                email: `e2e-${Date.now()}-${who}@arena.test`,
                password: 'secret1',
              })
              .expect(201),
          ),
        );
        const claimerSession = authSessionResponseSchema.parse(claimer.body);
        claimerToken = claimerSession.accessToken;
        claimerUserId = claimerSession.user.id;
        joinerUserId = authSessionResponseSchema.parse(joiner.body).user.id;
      }, 30_000);

      it('POST /groups/:groupId/invites answers the created invite contract and reuses the link', async () => {
        const create = () =>
          request(app.getHttpServer())
            .post(`/groups/${groupId}/invites`)
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .expect(201);

        const invite = createdInviteResponseSchema.parse((await create()).body);
        openToken = invite.token;
        expect(invite).toMatchObject({
          groupId,
          createdById: userId,
          targetGroupMemberId: null,
          uses: 0,
          maxUses: null,
          expiresAt: null,
          revokedAt: null,
          path: `/invites/${invite.token}`,
        });

        // A plain request reuses the group's active invite, so a shared link
        // stays valid however many times the sheet is opened.
        const again = createdInviteResponseSchema.parse((await create()).body);
        expect(again.token).toBe(openToken);
      });

      it('POST /groups/:groupId/invites rejects a zero cap and an unparseable expiry', async () => {
        await request(app.getHttpServer())
          .post(`/groups/${groupId}/invites`)
          .set('Authorization', `Bearer ${token}`)
          .send({ maxUses: 0 })
          .expect(400);

        await request(app.getHttpServer())
          .post(`/groups/${groupId}/invites`)
          .set('Authorization', `Bearer ${token}`)
          .send({ expiresAt: 'next friday' })
          .expect(400);
      });

      it('GET /invites/:token answers the open invite with the group roster', async () => {
        const res = await request(app.getHttpServer())
          .get(`/invites/${openToken}`)
          .expect(200);

        const invite = publicInviteResponseSchema.parse(res.body);
        if (invite.kind !== 'OPEN') {
          throw new Error('An invite with no target must answer OPEN');
        }

        expect(invite.targetUnavailable).toBe(false);
        expect(invite.group.id).toBe(groupId);
        // The inviter is named, not exposed: the strict parse above is what
        // keeps an id or an e-mail off a public page.
        expect(invite.createdBy).toMatchObject({
          firstName: 'E2E',
          lastName: 'Runner',
          nickname: null,
        });
        expect(AVATAR_COLOR_KEYS).toContain(invite.createdBy.avatarColor);
        // Unclaimed guests only, with the matches each has to lose.
        expect(invite.guests).toEqual(
          expect.arrayContaining([
            { groupMemberId: biaMemberId, displayName: 'Bia', matchesCount: 1 },
            {
              groupMemberId: guestMemberId,
              displayName: 'Zeca',
              matchesCount: 0,
            },
          ]),
        );
      });

      it('GET /groups/:groupId/invites/:token answers the same payload', async () => {
        const res = await request(app.getHttpServer())
          .get(`/groups/${groupId}/invites/${openToken}`)
          .expect(200);

        expect(publicInviteResponseSchema.parse(res.body).kind).toBe('OPEN');
      });

      it('GET /invites/:token answers a closed invite with its target recognition', async () => {
        const create = await request(app.getHttpServer())
          .post(`/groups/${groupId}/invites`)
          .set('Authorization', `Bearer ${token}`)
          .send({ targetGroupMemberId: biaMemberId })
          .expect(201);
        closedToken = createdInviteResponseSchema.parse(create.body).token;

        const res = await request(app.getHttpServer())
          .get(`/invites/${closedToken}`)
          .expect(200);

        const invite = publicInviteResponseSchema.parse(res.body);
        if (invite.kind !== 'CLOSED') {
          throw new Error('An invite with a target must answer CLOSED');
        }

        expect(invite.target).toMatchObject({
          groupMemberId: biaMemberId,
          displayName: 'Bia',
          matchesCount: 1,
        });
        // The record the person is being asked to recognize, from their side.
        expect(invite.target.recentMatches).toHaveLength(1);
        expect(invite.target.recentMatches[0]).toMatchObject({
          id: matchId,
          result: 'LOSS',
          partners: ['E2E Runner'],
          scoreFor: 2,
          scoreAgainst: 6,
        });
      });

      it('GET /invites/:token/guests/:guestId/summary answers the stub summary', async () => {
        const res = await request(app.getHttpServer())
          .get(`/invites/${openToken}/guests/${guestMemberId}/summary`)
          .expect(200);

        expect(claimStubSummarySchema.parse(res.body)).toMatchObject({
          groupMemberId: guestMemberId,
          displayName: 'Zeca',
          rank: null,
          matchesCount: 0,
          recentMatches: [],
        });
      });

      it('POST /invites/:token/claim/:guestId blocks a guest the claimer played against', async () => {
        // The creator partnered Bia in the one match, so the two cannot be the
        // same person — a real outcome with the proof, not an error.
        const res = await request(app.getHttpServer())
          .post(`/invites/${openToken}/claim/${biaMemberId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(201);

        const result = claimResultResponseSchema.parse(res.body);
        if (result.outcome !== 'BLOCKED') {
          throw new Error('A shared match must block the claim');
        }

        expect(result.stubName).toBe('Bia');
        expect(result.sharedMatches.map((match) => match.id)).toEqual([
          matchId,
        ]);
        expect(result.sharedMatches[0].teams.map((team) => team.team)).toEqual([
          'TEAM_A',
          'TEAM_B',
        ]);
        expect(
          result.sharedMatches[0].teams
            .flatMap((team) => team.players)
            .filter((player) => player.isStub || player.isYou),
        ).toHaveLength(2);
        // Who to ask for help, named the same way the roster names them.
        expect(result.admins.map((admin) => admin.name)).toEqual([
          'E2E Runner',
        ]);
      });

      it('POST /invites/:token/claim/:guestId answers the claimed membership', async () => {
        // Addressed to this guest before it is taken over, so the degradation
        // below has a closed invite to degrade.
        const create = await request(app.getHttpServer())
          .post(`/groups/${groupId}/invites`)
          .set('Authorization', `Bearer ${token}`)
          .send({ targetGroupMemberId: guestMemberId })
          .expect(201);
        degradedToken = createdInviteResponseSchema.parse(create.body).token;

        const res = await request(app.getHttpServer())
          .post(`/invites/${degradedToken}/claim/${guestMemberId}`)
          .set('Authorization', `Bearer ${claimerToken}`)
          .expect(201);

        const result = claimResultResponseSchema.parse(res.body);
        if (result.outcome !== 'CLAIMED') {
          throw new Error('An unclaimed guest must answer CLAIMED');
        }

        // The stub keeps its id and history; the account is now behind it, so
        // the frozen name gives way to the user's own.
        expect(result.membership).toMatchObject({
          id: guestMemberId,
          groupId,
          userId: claimerUserId,
          displayName: null,
          rating: 1000,
          role: 'MEMBER',
        });
        expect(result.membership.user).toMatchObject({
          firstName: 'Zeca',
          lastName: 'Conta',
          nickname: null,
        });
      });

      it('GET /invites/:token degrades a closed invite whose target was taken over', async () => {
        const res = await request(app.getHttpServer())
          .get(`/invites/${degradedToken}`)
          .expect(200);

        const invite = publicInviteResponseSchema.parse(res.body);
        if (invite.kind !== 'OPEN') {
          throw new Error('A taken-over target must degrade to OPEN');
        }

        // Still a way in: the roster, with the reason the recognition is gone.
        expect(invite.targetUnavailable).toBe(true);
        expect(invite.guests.map((guest) => guest.groupMemberId)).not.toContain(
          guestMemberId,
        );
      });

      it('POST /groups/:groupId/invites/:token/accept answers the new membership', async () => {
        const res = await request(app.getHttpServer())
          .post(`/groups/${groupId}/invites/${closedToken}/accept`)
          .send({ userId: joinerUserId })
          .expect(201);

        expect(claimMembershipSchema.parse(res.body)).toMatchObject({
          groupId,
          userId: joinerUserId,
          displayName: null,
          role: 'MEMBER',
        });
      });

      it('POST /groups/:groupId/invites/:token/accept rejects a body with no user', async () => {
        await request(app.getHttpServer())
          .post(`/groups/${groupId}/invites/${openToken}/accept`)
          .send({})
          .expect(400);
      });

      it('POST /invites/:token/accept joins the caller from the token', async () => {
        const res = await request(app.getHttpServer())
          .post(`/invites/${openToken}/accept`)
          .set('Authorization', `Bearer ${claimerToken}`)
          .expect(201);

        // Already a member through the claim: the same membership, not a second one.
        expect(claimMembershipSchema.parse(res.body).id).toBe(guestMemberId);
      });
    });

    it('DELETE /groups/:groupId/matches/:id answers the deleted contract', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/groups/${groupId}/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(matchDeletedResponseSchema.parse(res.body)).toEqual({
        success: true,
      });
    });
  });

  // The account's own routes, on their own user: a password change here must
  // not move the credentials the match flow signs in with.
  describe('account', () => {
    const password = 'secret1';
    let email: string;
    let token: string;
    let userId: string;

    beforeAll(async () => {
      email = `e2e-account-${Date.now()}@arena.test`;
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: '  Ana   Maria ',
          lastName: 'Silva',
          email: ` ${email.toUpperCase()} `,
          password,
          nickname: '   ',
        })
        .expect(201);

      const session = authSessionResponseSchema.parse(res.body);
      token = session.accessToken;
      userId = session.user.id;

      // The schema normalizes: spaces collapse, the e-mail lowercases, and an
      // all-whitespace nickname is stored as none at all.
      expect(session.user).toMatchObject({
        firstName: 'Ana Maria',
        email,
        nickname: null,
      });
    });

    it('POST /auth/login answers the session contract', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      const session = authSessionResponseSchema.parse(res.body);
      expect(session.user.id).toBe(userId);
      expect(session.accessToken).toBeTruthy();
    });

    it('POST /auth/login rejects a wrong password with 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    });

    it('GET /auth/me answers the account contract', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(accountSchema.parse(res.body).id).toBe(userId);
    });

    it('PATCH /me/profile answers the session contract and clears the nickname', async () => {
      const named = await request(app.getHttpServer())
        .patch('/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ nickname: 'Aninha', avatarColor: AVATAR_COLOR_KEYS[2] })
        .expect(200);

      expect(authSessionResponseSchema.parse(named.body).user).toMatchObject({
        nickname: 'Aninha',
        avatarColor: AVATAR_COLOR_KEYS[2],
      });

      const cleared = await request(app.getHttpServer())
        .patch('/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ nickname: '  ' })
        .expect(200);

      expect(
        authSessionResponseSchema.parse(cleared.body).user.nickname,
      ).toBeNull();
    });

    it('PATCH /me/profile rejects an empty body and a colour outside the palette', async () => {
      await request(app.getHttpServer())
        .patch('/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      await request(app.getHttpServer())
        .patch('/me/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatarColor: 'chartreuse' })
        .expect(400);
    });

    it('PATCH /me/password answers the acknowledgement contract', async () => {
      const res = await request(app.getHttpServer())
        .patch('/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: password, newPassword: 'secret2' })
        .expect(200);

      expect(passwordUpdatedResponseSchema.parse(res.body)).toEqual({
        success: true,
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'secret2' })
        .expect(201);
    });

    // Length stayed in the service precisely so the answer carries a code the
    // UI can turn into its own copy; a schema failure would not.
    it('PATCH /me/password answers a coded 400 for a password under the minimum', async () => {
      const res = await request(app.getHttpServer())
        .patch('/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'secret2', newPassword: 'short' })
        .expect(400);

      expect(res.body).toMatchObject({ code: 'PASSWORD_TOO_SHORT' });
    });
  });

  // The worker runs on wakes, not on a clock: a write hands off once it
  // commits, and anything else that becomes due — a retry, a lock left by a
  // process that died — is picked up by the one timer it arms when the queue
  // goes quiet.
  describe('processing queue', () => {
    let prisma: PrismaService;
    let runner: ProcessingJobRunnerService;
    let writer: ProcessingJobWriterService;
    let groupId: string;

    beforeAll(async () => {
      prisma = app.get(PrismaService);
      runner = app.get(ProcessingJobRunnerService);
      writer = app.get(ProcessingJobWriterService);

      const register = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'Queue',
          lastName: 'Runner',
          email: `e2e-queue-${Date.now()}@arena.test`,
          password: 'secret1',
        })
        .expect(201);
      const token = (register.body as { accessToken: string }).accessToken;

      const group = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E queue group' })
        .expect(201);
      groupId = (group.body as { id: string }).id;

      await waitUntilQueueQuiet(prisma);
    });

    it('has nothing to wait for while the queue is empty', async () => {
      await expect(runner.getNextDueDelayMs()).resolves.toBeNull();
    });

    it('waits for the earlier of a due retry and an expiring lock', async () => {
      const fixtureIds: string[] = [];

      try {
        const retry = await prisma.processingJob.create({
          data: {
            type: 'GROUP_RANKING_REBUILD',
            groupId,
            availableAt: new Date(Date.now() + 30_000),
          },
        });
        fixtureIds.push(retry.id);

        const retryDelayMs = await runner.getNextDueDelayMs();
        expect(retryDelayMs).toBeGreaterThan(28_000);
        expect(retryDelayMs).toBeLessThan(31_000);

        // Locked 50 s ago, so the 60 s lock expires in ~10 s — sooner than the
        // retry, and the worker has to come back for it.
        const orphan = await prisma.processingJob.create({
          data: {
            type: 'GROUP_RANKING_REBUILD',
            groupId,
            status: 'PROCESSING',
            lockedAt: new Date(Date.now() - 50_000),
            lockedBy: 'dead-worker',
            attemptCount: 1,
          },
        });
        fixtureIds.push(orphan.id);

        const lockDelayMs = await runner.getNextDueDelayMs();
        expect(lockDelayMs).toBeGreaterThan(8_000);
        expect(lockDelayMs).toBeLessThan(11_000);
      } finally {
        await prisma.processingJob.deleteMany({
          where: { id: { in: fixtureIds } },
        });
      }
    });

    it('frees a lock left behind by a dead worker', async () => {
      const job = await prisma.processingJob.create({
        data: {
          type: 'GROUP_RANKING_REBUILD',
          groupId,
          status: 'PROCESSING',
          lockedAt: new Date(Date.now() - 61_000),
          lockedBy: 'dead-worker',
          attemptCount: 1,
        },
      });

      writer.wake();

      await waitUntilJobStatus(prisma, job.id, 'DONE');
    });

    it('comes back for a retry with no write in between', async () => {
      // A match job without a match fails on its first attempt, so the retry
      // falls due two seconds later with nothing else touching the queue.
      const job = await writer.enqueueGroupJob({
        type: 'MATCH_CREATED',
        groupId,
      });

      try {
        await waitUntilJobAttempt(prisma, job.id, 2);
      } finally {
        await prisma.processingJob.delete({ where: { id: job.id } });
      }
    });
  });
});
