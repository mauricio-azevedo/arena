import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  matchDeletedResponseSchema,
  matchResponseSchema,
  type MatchBody,
} from '@arena/contracts/matches';
import { AppModule } from '../src/app.module';

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
    let groupId: string;
    let matchId: string;

    const matchBody: MatchBody = {
      teamAPlayer1: { name: 'Ana' },
      teamAPlayer2: { name: 'Bia' },
      teamBPlayer1: { name: 'Caio' },
      teamBPlayer2: { name: 'Davi' },
      gamesA: 6,
      gamesB: 3,
    };

    beforeAll(async () => {
      // Unique per run: the database outlives the test locally.
      const email = `e2e-${Date.now()}@arena.test`;
      const register = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          firstName: 'E2E',
          lastName: 'Runner',
          email,
          password: 'secret1',
        })
        .expect(201);
      // Auth and groups get their contracts in later sub-issues of #267.
      token = (register.body as { accessToken: string }).accessToken;

      const group = await request(app.getHttpServer())
        .post('/groups')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'E2E group' })
        .expect(201);
      groupId = (group.body as { id: string }).id;
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
