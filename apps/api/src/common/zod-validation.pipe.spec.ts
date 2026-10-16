import { BadRequestException } from '@nestjs/common';
import { matchBodySchema } from '@arena/contracts';
import { ZodValidationPipe } from './zod-validation.pipe';

const uuid = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;

const validBody = {
  teamAPlayer1: { memberId: uuid(1) },
  teamAPlayer2: { name: '  Ana  ' },
  teamBPlayer1: { memberId: uuid(3) },
  teamBPlayer2: { memberId: uuid(4) },
  gamesA: 6,
  gamesB: 3,
};

function responseOf(run: () => unknown) {
  try {
    run();
  } catch (error) {
    if (error instanceof BadRequestException) {
      return error.getResponse();
    }

    throw error;
  }

  throw new Error('Expected a BadRequestException');
}

// Exercised through a real contract, so the schema's rules are locked in here too.
// The web joins `message` arrays, so the 400 body shape is part of the test. Zod's
// own copy is matched by path only; the draw message is ours and matched exactly.
describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(matchBodySchema);

  it('returns the parsed body with the schema transforms applied', () => {
    expect(pipe.transform(validBody)).toEqual({
      ...validBody,
      teamAPlayer2: { name: 'Ana' },
    });
  });

  it('answers 400 listing every issue with its path', () => {
    expect(
      responseOf(() =>
        pipe.transform({ ...validBody, gamesB: -1, playedAt: 'ontem' }),
      ),
    ).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: [
        expect.stringMatching(/^gamesB: /),
        expect.stringMatching(/^playedAt: /),
      ],
    });
  });

  it('reports a body-level issue without a path prefix', () => {
    expect(responseOf(() => pipe.transform('nope'))).toMatchObject({
      message: [expect.stringMatching(/^Invalid input/)],
    });
  });

  it.each([
    [
      'a draw',
      { ...validBody, gamesB: 6 },
      /^gamesB: A match cannot end in a draw$/,
    ],
    [
      'a slot naming both a member and a guest',
      { ...validBody, teamAPlayer1: { memberId: uuid(1), name: 'Ana' } },
      /^teamAPlayer1: /,
    ],
    ['an empty slot', { ...validBody, teamAPlayer1: {} }, /^teamAPlayer1: /],
    [
      'a blank guest name',
      { ...validBody, teamAPlayer2: { name: '   ' } },
      /^teamAPlayer2\.name: /,
    ],
    [
      'a guest name over 60 characters',
      { ...validBody, teamAPlayer2: { name: 'a'.repeat(61) } },
      /^teamAPlayer2\.name: /,
    ],
    [
      'a member id that is not a uuid',
      { ...validBody, teamAPlayer1: { memberId: 'abc' } },
      /^teamAPlayer1\.memberId: /,
    ],
    ['a fractional score', { ...validBody, gamesA: 6.5 }, /^gamesA: /],
    [
      'a playedAt without timezone',
      { ...validBody, playedAt: '2026-10-16T18:00:00' },
      /^playedAt: /,
    ],
    ['an unknown key', { ...validBody, winner: 'A' }, /^Unrecognized key/],
  ])('rejects %s', (_case, body, message) => {
    expect(responseOf(() => pipe.transform(body))).toMatchObject({
      message: [expect.stringMatching(message)],
    });
  });
});
