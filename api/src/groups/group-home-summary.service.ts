import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaClientLike = Prisma.TransactionClient | PrismaService;

@Injectable()
export class GroupHomeSummaryService {
  constructor(private readonly prisma: PrismaService) {}

  async syncGroupSummary(groupId: string, tx?: PrismaClientLike) {
    const client = tx ?? this.prisma;
    const membersCount = await client.groupMember.count({
      where: {
        groupId,
        leftAt: null,
      },
    });

    await client.$executeRaw`
      INSERT INTO "GroupHomeSummary" (
        "groupId",
        "membersCount",
        "leaders",
        "createdAt",
        "updatedAt"
      )
      VALUES (${groupId}, ${membersCount}, '[]'::jsonb, NOW(), NOW())
      ON CONFLICT ("groupId") DO UPDATE SET
        "membersCount" = EXCLUDED."membersCount",
        "updatedAt" = NOW()
    `;
  }
}
