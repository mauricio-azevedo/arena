import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GroupMemberRole } from '../generated/prisma/enums';
import {
  MEMBER_USER_SELECT,
  resolveMemberDisplayName,
} from '../common/member-display-name';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';

// Trims and validates a stub player's name, returning the canonical form.
function normalizeGuestName(rawName: string): string {
  const name = rawName?.trim();

  if (!name) {
    throw new BadRequestException('Name is required');
  }

  if (name.length > 60) {
    throw new BadRequestException('Name is too long');
  }

  return name;
}

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    groupId: string,
    requesterUserId: string,
    body: { userId: string },
  ) {
    if (!body.userId) {
      throw new BadRequestException('User is required');
    }

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requesterUserId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.leftAt) {
      throw new ForbiddenException('Only active group members can add members');
    }

    if (requesterMembership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only group admins can add members');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: body.userId,
        },
      },
    });

    if (existingMembership && !existingMembership.leftAt) {
      return this.findOne(existingMembership.id);
    }

    const membership = existingMembership
      ? await this.prisma.groupMember.update({
          where: { id: existingMembership.id },
          data: {
            leftAt: null,
          },
        })
      : await this.prisma.groupMember.create({
          data: {
            groupId,
            userId: body.userId,
          },
        });

    return this.findOne(membership.id);
  }

  // Creates a stub player (jogador sem conta): just a name, no User account. Any
  // active member can do it — it's low-risk and high-frequency, the arena path.
  async createGuest(
    groupId: string,
    requesterUserId: string,
    body: { name: string },
  ) {
    // Validate the name up front, before any lookups.
    normalizeGuestName(body.name);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: requesterUserId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.leftAt) {
      throw new ForbiddenException('Only active group members can add players');
    }

    const memberId = await this.createGuestRow(this.prisma, groupId, body.name);

    return this.findOne(memberId);
  }

  // Shared core for creating a stub player row (jogador sem conta): validate the
  // name and insert the membership, returning its id. The caller owns the group
  // and requester-authorization checks. Takes a client so it can run inside an
  // outer transaction — e.g. so a stub is only persisted when the match it belongs
  // to is, never as an orphan from an abandoned form.
  async createGuestRow(
    client: Prisma.TransactionClient,
    groupId: string,
    rawName: string,
  ): Promise<string> {
    const name = normalizeGuestName(rawName);

    const membership = await client.groupMember.create({
      data: {
        groupId,
        userId: null,
        displayName: name,
      },
    });

    return membership.id;
  }

  // Reverts a claim (admin only): detaches the account and turns the membership back
  // into a stub, freezing the current name into displayName so the row stays labeled.
  // History stays on the same groupMemberId. Case A of claiming is clean to undo.
  async unlinkAccount(
    groupId: string,
    memberId: string,
    requesterUserId: string,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const requesterMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: requesterUserId } },
    });

    if (!requesterMembership || requesterMembership.leftAt) {
      throw new ForbiddenException('Only active group members can do this');
    }

    if (requesterMembership.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException('Only group admins can unlink accounts');
    }

    const member = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
      include: this.memberInclude(),
    });

    if (!member || member.groupId !== groupId) {
      throw new NotFoundException('Member not found in this group');
    }

    if (member.userId === null) {
      throw new BadRequestException('Este jogador não tem conta vinculada.');
    }

    // Block self-unlink: an admin detaching their own account could strand the
    // group with no admin. (Unlinking another admin always leaves the requester.)
    if (member.userId === requesterUserId) {
      throw new BadRequestException(
        'Você não pode desvincular a própria conta.',
      );
    }

    await this.prisma.groupMember.update({
      where: { id: member.id },
      data: { userId: null, displayName: resolveMemberDisplayName(member) },
    });

    return this.findOne(member.id);
  }

  async findAll(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.groupMember.findMany({
      where: {
        groupId,
        leftAt: null,
      },
      orderBy: [
        { rating: 'desc' },
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
      include: this.memberInclude(),
    });
  }

  private findOne(id: string) {
    return this.prisma.groupMember.findUnique({
      where: { id },
      include: this.memberInclude(),
    });
  }

  private memberInclude() {
    return {
      user: {
        select: {
          id: true,
          ...MEMBER_USER_SELECT,
          email: true,
        },
      },
    };
  }
}
