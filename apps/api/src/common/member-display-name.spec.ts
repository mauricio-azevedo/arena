import { resolveMemberDisplayName } from './member-display-name';

describe('resolveMemberDisplayName', () => {
  it('uses the linked user name when present', () => {
    expect(
      resolveMemberDisplayName({
        user: { firstName: 'Ana', lastName: 'Souza' },
        displayName: null,
      }),
    ).toBe('Ana Souza');
  });

  it('falls back to displayName for stub players (no user)', () => {
    expect(
      resolveMemberDisplayName({ user: null, displayName: 'Visitante' }),
    ).toBe('Visitante');
  });

  it('trims a stub displayName', () => {
    expect(
      resolveMemberDisplayName({ user: null, displayName: '  João  ' }),
    ).toBe('João');
  });

  it('returns a generic label when nothing is available', () => {
    expect(resolveMemberDisplayName({ user: null, displayName: null })).toBe(
      'Jogador',
    );
  });
});
