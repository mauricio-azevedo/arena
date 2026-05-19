import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    groupId: string,
    body: { userId: string; displayName?: string },
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

    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const displayName =
      body.displayName?.trim() || `${user.firstName} ${user.lastName}`.trim();

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId: body.userId,
        displayName,
      },
    });
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
      orderBy: [{ rating: 'desc' }, { displayName: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
