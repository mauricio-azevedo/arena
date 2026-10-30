import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type {
  PasswordUpdatedResponse,
  UpdatePasswordBody,
} from '@arena/contracts/me';
import { MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH } from '@arena/contracts';
import {
  API_ERROR_CODES,
  codedBadRequest,
  codedUnauthorized,
} from '../common/api-errors';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 10;

@Injectable()
export class MePasswordService {
  constructor(private readonly prisma: PrismaService) {}

  // Length lives here, not in the schema: the UI turns each failure into its own
  // copy, and only a coded answer carries that (`PASSWORD_TOO_SHORT` /
  // `PASSWORD_TOO_LONG`).
  async updatePassword(
    userId: string,
    body: UpdatePasswordBody,
  ): Promise<PasswordUpdatedResponse> {
    this.ensureNewPasswordLength(body.newPassword);

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
      body.currentPassword,
      currentUser.passwordHash,
    );

    if (!currentPasswordMatches) {
      throw codedUnauthorized(
        API_ERROR_CODES.INVALID_CURRENT_PASSWORD,
        'Invalid current password',
      );
    }

    const isSamePassword = await bcrypt.compare(
      body.newPassword,
      currentUser.passwordHash,
    );

    if (isSamePassword) {
      throw codedBadRequest(
        API_ERROR_CODES.PASSWORD_SAME_AS_CURRENT,
        'New password must be different from current password',
      );
    }

    const passwordHash = await bcrypt.hash(body.newPassword, SALT_ROUNDS);

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

  private ensureNewPasswordLength(value: string) {
    if (value.length < MIN_PASSWORD_LENGTH) {
      throw codedBadRequest(
        API_ERROR_CODES.PASSWORD_TOO_SHORT,
        `New password must have at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    if (Buffer.byteLength(value, 'utf8') > MAX_PASSWORD_BYTES) {
      throw codedBadRequest(
        API_ERROR_CODES.PASSWORD_TOO_LONG,
        `New password must have at most ${MAX_PASSWORD_BYTES} bytes`,
      );
    }
  }

  private isRecordNotFoundError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
