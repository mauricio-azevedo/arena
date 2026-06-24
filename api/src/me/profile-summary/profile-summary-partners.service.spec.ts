import { ProfileSummaryPartnersService } from './profile-summary-partners.service';
import type { PrismaService } from '../../prisma/prisma.service';

type PrismaMock = {
  groupMemberPartnerStats: { findMany: jest.Mock };
};

function buildService() {
  const prisma: PrismaMock = {
    groupMemberPartnerStats: { findMany: jest.fn() },
  };
  const service = new ProfileSummaryPartnersService(
    prisma as unknown as PrismaService,
  );
  return { service, prisma };
}

function row(overrides: {
  partnerMemberId: string;
  matchesTogether: number;
  winsTogether: number;
  userId?: string | null;
  firstName?: string;
  lastName?: string;
  displayName?: string | null;
  currentRank?: number | null;
  avatarColor?: string | null;
}) {
  const {
    partnerMemberId,
    matchesTogether,
    winsTogether,
    userId = null,
    firstName,
    lastName,
    displayName = null,
    currentRank = null,
    avatarColor = null,
  } = overrides;

  return {
    partnerMemberId,
    matchesTogether,
    winsTogether,
    partnerMember: {
      userId,
      displayName,
      currentRank,
      user: firstName
        ? { firstName, lastName: lastName ?? '', avatarColor }
        : null,
    },
  };
}

const USER_ID = 'me';

describe('ProfileSummaryPartnersService.findPartners', () => {
  it('returns empty results when there are no partner rows', async () => {
    const { service, prisma } = buildService();
    prisma.groupMemberPartnerStats.findMany.mockResolvedValue([]);

    const result = await service.findPartners(USER_ID);

    expect(result).toEqual({
      bestPartner: null,
      partners: [],
      partnerCount: 0,
    });
  });

  it('merges the same account across groups and sources rank from the most-played group', async () => {
    const { service, prisma } = buildService();
    prisma.groupMemberPartnerStats.findMany.mockResolvedValue([
      // Same partner (Kleiton) in two groups, distinct membership ids.
      row({
        partnerMemberId: 'k-group-a',
        userId: 'kleiton',
        firstName: 'Kleiton',
        matchesTogether: 8,
        winsTogether: 7,
        currentRank: 5,
        avatarColor: 'blue',
      }),
      row({
        partnerMemberId: 'k-group-b',
        userId: 'kleiton',
        firstName: 'Kleiton',
        matchesTogether: 3,
        winsTogether: 2,
        currentRank: 2,
      }),
    ]);

    const result = await service.findPartners(USER_ID);

    expect(result.partnerCount).toBe(1);
    expect(result.partners[0]).toEqual({
      userId: 'kleiton',
      displayName: 'Kleiton',
      avatarColor: 'blue',
      // Rank comes from group A (8 matches > 3 matches).
      currentRank: 5,
      matchesTogether: 11,
      winsTogether: 9,
      lossesTogether: 2,
      winRate: 82,
    });
  });

  it('keeps stub partners (no account) distinct per membership', async () => {
    const { service, prisma } = buildService();
    prisma.groupMemberPartnerStats.findMany.mockResolvedValue([
      row({
        partnerMemberId: 'stub-1',
        displayName: 'Visitante',
        matchesTogether: 4,
        winsTogether: 4,
      }),
      row({
        partnerMemberId: 'stub-2',
        displayName: 'Visitante',
        matchesTogether: 4,
        winsTogether: 4,
      }),
    ]);

    const result = await service.findPartners(USER_ID);

    expect(result.partnerCount).toBe(2);
  });

  it('picks the best partner by win rate among partnerships with enough games', async () => {
    const { service, prisma } = buildService();
    prisma.groupMemberPartnerStats.findMany.mockResolvedValue([
      // Tiny sample at 100% — must NOT win "melhor dupla".
      row({
        partnerMemberId: 'noise',
        userId: 'noise',
        firstName: 'Noise',
        matchesTogether: 1,
        winsTogether: 1,
      }),
      // Proven partnership.
      row({
        partnerMemberId: 'proven',
        userId: 'proven',
        firstName: 'Proven',
        matchesTogether: 10,
        winsTogether: 8,
      }),
    ]);

    const result = await service.findPartners(USER_ID);

    expect(result.bestPartner?.userId).toBe('proven');
    expect(result.bestPartner?.winRate).toBe(80);
  });

  it('falls back to the strongest partnership when none clears the sample bar', async () => {
    const { service, prisma } = buildService();
    prisma.groupMemberPartnerStats.findMany.mockResolvedValue([
      row({
        partnerMemberId: 'a',
        userId: 'a',
        firstName: 'A',
        matchesTogether: 2,
        winsTogether: 2,
      }),
      row({
        partnerMemberId: 'b',
        userId: 'b',
        firstName: 'B',
        matchesTogether: 1,
        winsTogether: 0,
      }),
    ]);

    const result = await service.findPartners(USER_ID);

    // No partner has >= 3 games, so the top of the sorted list wins.
    expect(result.bestPartner?.userId).toBe('a');
  });
});
