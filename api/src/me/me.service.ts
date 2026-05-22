import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateProfileInput } from './types/update-profile-input.type';

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFILE_UPDATE_FIELDS = ['firstName', 'lastName', 'email'] as const;

type NormalizedUpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
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

  async updateProfile(userId: string, body: UpdateProfileInput) {
    const input = this.normalizeUpdateProfileInput(body);

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.userSelect(),
    });

    if (!currentUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const updateData: NormalizedUpdateProfileInput = {};

    if (input.firstName !== undefined && input.firstName !== currentUser.firstName) {
      updateData.firstName = input.firstName;
    }

    if (input.lastName !== undefined && input.lastName !== currentUser.lastName) {
      updateData.lastName = input.lastName;
    }

    if (input.email !== undefined && input.email !== currentUser.email) {
      await this.ensureEmailIsAvailable(input.email, currentUser.id);
      updateData.email = input.email;
    }

    if (Object.keys(updateData).length === 0) {
      return this.buildProfileResponse(currentUser);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: currentUser.id },
        data: updateData,
        select: this.userSelect(),
      });

      return this.buildProfileResponse(updatedUser);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email already in use');
      }

      throw error;
    }
  }

  private normalizeUpdateProfileInput(body: UpdateProfileInput) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid profile update payload');
    }

    const unknownFields = Object.keys(body).filter(
      (field) => !PROFILE_UPDATE_FIELDS.includes(field as (typeof PROFILE_UPDATE_FIELDS)[number]),
    );

    if (unknownFields.length > 0) {
      throw new BadRequestException('Unsupported profile update fields');
    }

    const input: NormalizedUpdateProfileInput = {};
    const hasFirstName = Object.prototype.hasOwnProperty.call(body, 'firstName');
    const hasLastName = Object.prototype.hasOwnProperty.call(body, 'lastName');
    const hasEmail = Object.prototype.hasOwnProperty.call(body, 'email');

    if (!hasFirstName && !hasLastName && !hasEmail) {
      throw new BadRequestException('At least one profile field is required');
    }

    if (hasFirstName) {
      input.firstName = this.normalizeNameField(body.firstName, 'First name');
    }

    if (hasLastName) {
      input.lastName = this.normalizeNameField(body.lastName, 'Last name');
    }

    if (hasEmail) {
      input.email = this.normalizeEmailField(body.email);
    }

    return input;
  }

  private normalizeNameField(value: unknown, label: string) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} must be a string`);
    }

    const normalized = value.trim().replace(/\s+/g, ' ');

    if (!normalized) {
      throw new BadRequestException(`${label} is required`);
    }

    if (normalized.length > MAX_NAME_LENGTH) {
      throw new BadRequestException(`${label} must have at most ${MAX_NAME_LENGTH} characters`);
    }

    return normalized;
  }

  private normalizeEmailField(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('Email must be a string');
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException('Email is required');
    }

    if (normalized.length > MAX_EMAIL_LENGTH) {
      throw new BadRequestException(`Email must have at most ${MAX_EMAIL_LENGTH} characters`);
    }

    if (!EMAIL_REGEX.test(normalized)) {
      throw new BadRequestException('Invalid email');
    }

    return normalized;
  }

  private async ensureEmailIsAvailable(email: string, currentUserId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== currentUserId) {
      throw new ConflictException('Email already in use');
    }
  }

  private buildProfileResponse(user: ReturnType<MeService['userSelect']> extends infer T ? never : never) {
    return {
      user,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
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
