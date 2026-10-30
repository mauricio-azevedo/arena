import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AccountResponse,
  AuthSessionResponse,
} from '@arena/contracts/auth';
import type { GroupMembershipResponse } from '@arena/contracts/groups';
import type { UpdateProfileBody } from '@arena/contracts/me';
import { Prisma } from '../generated/prisma/client';
import { ACCOUNT_SELECT } from '../auth/account-select';
import { GROUP_MEMBERSHIP_SELECT } from '../groups/group-membership-select';
import { PrismaService } from '../prisma/prisma.service';
import { API_ERROR_CODES, codedConflict } from '../common/api-errors';

// What the edit actually writes: the submitted fields minus the ones already at
// that value.
type ProfileUpdateData = {
  firstName?: string;
  lastName?: string;
  // null clears the nickname back to "First Last".
  nickname?: string | null;
  email?: string;
  avatarColor?: string;
};

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  findMyGroups(userId: string): Promise<GroupMembershipResponse[]> {
    return this.prisma.groupMember.findMany({
      where: {
        userId,
        leftAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: GROUP_MEMBERSHIP_SELECT,
    });
  }

  // The body arrives parsed and normalized (`updateProfileBodySchema`); what is
  // left here is the rule a schema cannot see — the e-mail must be free.
  async updateProfile(
    userId: string,
    body: UpdateProfileBody,
  ): Promise<AuthSessionResponse> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ACCOUNT_SELECT,
    });

    if (!currentUser) {
      throw new UnauthorizedException('Invalid token');
    }

    // Unchanged fields are dropped, so re-saving the same form never checks the
    // account's own e-mail for uniqueness against itself.
    const updateData: ProfileUpdateData = {};

    if (
      body.firstName !== undefined &&
      body.firstName !== currentUser.firstName
    ) {
      updateData.firstName = body.firstName;
    }

    if (body.lastName !== undefined && body.lastName !== currentUser.lastName) {
      updateData.lastName = body.lastName;
    }

    if (body.nickname !== undefined && body.nickname !== currentUser.nickname) {
      updateData.nickname = body.nickname;
    }

    if (
      body.avatarColor !== undefined &&
      body.avatarColor !== currentUser.avatarColor
    ) {
      updateData.avatarColor = body.avatarColor;
    }

    if (body.email !== undefined && body.email !== currentUser.email) {
      await this.ensureEmailIsAvailable(body.email, currentUser.id);
      updateData.email = body.email;
    }

    if (Object.keys(updateData).length === 0) {
      return this.buildProfileResponse(currentUser);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: currentUser.id },
        data: updateData,
        select: ACCOUNT_SELECT,
      });

      return this.buildProfileResponse(updatedUser);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw codedConflict(
          API_ERROR_CODES.EMAIL_IN_USE,
          'Email already in use',
        );
      }

      if (this.isRecordNotFoundError(error)) {
        throw new UnauthorizedException('Invalid token');
      }

      throw error;
    }
  }

  private async ensureEmailIsAvailable(email: string, currentUserId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== currentUserId) {
      throw codedConflict(API_ERROR_CODES.EMAIL_IN_USE, 'Email already in use');
    }
  }

  // The JWT carries the e-mail, so an edit hands back a freshly signed one.
  private buildProfileResponse(user: AccountResponse): AuthSessionResponse {
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

  private isRecordNotFoundError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
