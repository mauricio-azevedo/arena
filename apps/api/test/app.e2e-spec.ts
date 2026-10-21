import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  matchDeletedResponseSchema,
  matchResponseSchema,
  type MatchBody,
} from '@arena/contracts/matches';
import {
  profileMatchListItemSchema,
  profileSummaryResponseSchema,
} from '@arena/contracts/profiles';
import { AppModule } from '../src/app.module';

// Ratings, ranks and partner stats are projected by the job a match write
// enqueues, picked up by the worker's 1 s poll. Tests that read them wait for
// the match instead of racing the queue.
async function waitUntilProcessed(
  app: INestApplication<App>,
  groupId: string,
  matchId: string,
) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const res = await request(app.getHttpServer())
      .get(`/groups/${groupId}/matches/${matchId}`)
      .expect(200);

    if (matchResponseSchema.parse(res.body).processingStatus === 'PROCESSED') {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error(`Match ${matchId} was not processed within 15 s`);
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
      // Auth, groups and members get their contracts in later sub-issues of #267.
      const registered = register.body as {
        accessToken: string;
        user: { id: string };
      };
      token = registered.accessToken;
      userId = registered.user.id;

      const group = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E group' })
        .expect(201);
      groupId = (group.body as { id: string }).id;

      // The registered user plays from the creator's seat, so the profile routes
      // answer with a real match, partner and rank; the other three are guests.
      const members = await request(app.getHttpServer())
        .get(`/groups/${groupId}/members`)
        .expect(200);
      const creator = (
        members.body as { id: string; userId: string | null }[]
      ).find((member) => member.userId === userId);

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
      expect(match.players).toHaveLength(4);
      expect(match.winnerTeam).toBe('TEAM_A');
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
      const res = await request(app.getHttpServer())
        .patch(`/groups/${groupId}/matches/${matchId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...matchBody, gamesA: 2, gamesB: 6 })
        .expect(200);

      expect(matchResponseSchema.parse(res.body).winnerTeam).toBe('TEAM_B');
    });

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
});
