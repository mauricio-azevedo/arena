import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateAccountDto } from './dto/update-account.dto';

type AccountUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  findMyGroups(userId: string) {
    return this.prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        role: true,
        rating: true,
        displayName: true,
        groupId: true,
        createdAt: true,
        updatedAt: true,
        group: {
          include: {
            _count: {
              select: {
                members: true,
                matches: true,
              },
            },
          },
        },
      },
    });
  }

  async updateAccount(userId: string, body: UpdateAccountDto) {
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const currentPassword = body.currentPassword;

    if (!firstName || !lastName || !email) {
      throw new BadRequestException('Name and email are required');
    }

    if (!isValidEmail(email)) {
      throw new BadRequestException('Enter a valid email');
    }

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Invalid user');
    }

    const isChangingEmail = email !== currentUser.email;

    if (isChangingEmail) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required to change email');
      }

      await this.verifyCurrentPassword(currentPassword, currentUser.passwordHash);

      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingEmailUser && existingEmailUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const displayName = `${firstName} ${lastName}`.trim();

    const user = await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          email,
        },
        select: this.userSelect(),
      });

      await tx.groupMember.updateMany({
        where: {
          userId,
          leftAt: null,
        },
        data: {
          displayName,
        },
      });

      return updatedUser;
    });

    return this.buildAccountResponse(user);
  }

  private async verifyCurrentPassword(currentPassword: string, passwordHash: string) {
    const passwordMatches = await bcrypt.compare(currentPassword, passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid current password');
    }
  }

  private buildAccountResponse(user: AccountUser) {
    return {
      user,
      accessToken: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    };
  }

  private userSelect() {
    return {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
