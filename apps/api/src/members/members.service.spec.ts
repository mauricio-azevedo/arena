import { ForbiddenException } from '@nestjs/common';
import { MembersService } from './members.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { ProcessingJobWriterService } from '../processing/processing-job-writer.service';

type PrismaMock = {
  group: { findUnique: jest.Mock };
  groupMember: {
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    create: jest.Mock;
  };
};

function buildService() {
  const prisma: PrismaMock = {
    group: { findUnique: jest.fn() },
    groupMember: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
  };
  const processingJobs = { enqueueGroupJob: jest.fn() };
  const service = new MembersService(
    prisma as unknown as PrismaService,
    processingJobs as unknown as ProcessingJobWriterService,
  );
  return { service, prisma };
}

const GROUP_ID = 'group-1';
const REQUESTER_ID = 'user-1';

// The name's shape (trimmed, 1–60) is the contract's job at the route; the
// service only decides who may add a stub player.
describe('MembersService.createGuest', () => {
  it('lets any active member (non-admin) create a stub player', async () => {
    const { service, prisma } = buildService();
    prisma.group.findUnique.mockResolvedValue({ id: GROUP_ID });
    // requester membership (active, MEMBER role)
    prisma.groupMember.findUnique.mockResolvedValue({
      id: 'm-1',
      role: 'MEMBER',
      leftAt: null,
    });
    prisma.groupMember.create.mockResolvedValue({ id: 'stub-1' });
    // findOne after create
    prisma.groupMember.findUniqueOrThrow.mockResolvedValue({
      id: 'stub-1',
      displayName: 'Visitante',
    });

    const result = await service.createGuest(GROUP_ID, REQUESTER_ID, {
      name: 'Visitante',
    });

    expect(prisma.groupMember.create).toHaveBeenCalledWith({
      data: { groupId: GROUP_ID, userId: null, displayName: 'Visitante' },
    });
    expect(result).toEqual({ id: 'stub-1', displayName: 'Visitante' });
  });

  it('forbids a non-member from creating a stub player', async () => {
    const { service, prisma } = buildService();
    prisma.group.findUnique.mockResolvedValue({ id: GROUP_ID });
    prisma.groupMember.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.createGuest(GROUP_ID, REQUESTER_ID, { name: 'Visitante' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.groupMember.create).not.toHaveBeenCalled();
  });
});
