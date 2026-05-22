import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdatePasswordInput } from './types/update-password-input.type';

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;
const SALT_ROUNDS = 10;
const PASSWORD_UPDATE_FIELDS = ['currentPassword', 'newPassword'] as const;

type NormalizedUpdatePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

@Injectable()
export class MePasswordService {
  constructor(private readonly prisma: PrismaService) {}

  async updatePassword(userId: string, body: UpdatePasswordInput) {
    const input = this.normalizeUpdatePasswordInput(body);

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Invalid token');
    }

    const currentPasswordMatches = await bcrypt.compare(
      input.currentPassword,
      currentUser.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Invalid current password');
    }

    const isSamePassword = await bcrypt.compare(
      input.newPassword,
      currentUser.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    try {
      await this.prisma.user.update({
        where: { id: currentUser.id },
        data: { passwordHash },
        select: { id: true },
      });
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        throw new UnauthorizedException('Invalid token');
      }

      throw error;
    }

    return { success: true };
  }

  private normalizeUpdatePasswordInput(body: UpdatePasswordInput): NormalizedUpdatePasswordInput {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Invalid password update payload');
    }

    const unknownFields = Object.keys(body).filter(
      (field) => !PASSWORD_UPDATE_FIELDS.includes(field as (typeof PASSWORD_UPDATE_FIELDS)[number]),
    );

    if (unknownFields.length > 0) {
      throw new BadRequestException('Unsupported password update fields');
    }

    return {
      currentPassword: this.normalizePasswordField(body.currentPassword, 'Current password'),
      newPassword: this.normalizePasswordField(body.newPassword, 'New password'),
    };
  }

  private normalizePasswordField(value: unknown, label: string) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} must be a string`);
    }

    if (!value) {
      throw new BadRequestException(`${label} is required`);
    }

    if (value.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`${label} must have at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    if (value.length > MAX_PASSWORD_LENGTH) {
      throw new BadRequestException(`${label} must have at most ${MAX_PASSWORD_LENGTH} characters`);
    }

    return value;
  }

  private isRecordNotFoundError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
