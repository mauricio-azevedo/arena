import { ForbiddenException } from '@nestjs/common';
import { GroupMemberRole } from '../generated/prisma/enums';
import type { PrismaService } from '../prisma/prisma.service';

// Loads the viewer's membership and asserts they're an active admin of the group,
// returning it (with a name source) so callers can attribute the action they gate.
export async function requireGroupAdmin(
  prisma: PrismaService,
  groupId: string,
  userId: string,
) {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: {
      role: true,
      leftAt: true,
      displayName: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!membership || membership.leftAt) {
    throw new ForbiddenException('Apenas membros do grupo podem fazer isso');
  }
  if (membership.role !== GroupMemberRole.ADMIN) {
    throw new ForbiddenException('Apenas admins do grupo podem fazer isso');
  }

  return membership;
}
