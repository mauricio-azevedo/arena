import { API_ERROR_CODES, codedConflict } from '../common/api-errors';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AccountResponse,
  AuthSessionResponse,
  LoginBody,
  RegisterBody,
} from '@arena/contracts/auth';
import * as bcrypt from 'bcryptjs';
import { ACCOUNT_SELECT } from './account-select';
import { PrismaService } from '../prisma/prisma.service';
import { pickDefaultAvatarColor } from '../common/avatar-color';

const SALT_ROUNDS = 10;

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterBody): Promise<AuthSessionResponse> {
    const { firstName, lastName, email, password } = body;
    // Optional: an absent or emptied nickname stays null so it never shadows the
    // "First Last" display name downstream.
    const nickname = body.nickname ?? null;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw codedConflict(API_ERROR_CODES.EMAIL_IN_USE, 'Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        nickname,
        email,
        passwordHash,
        avatarColor: pickDefaultAvatarColor(email),
      },
      select: ACCOUNT_SELECT,
    });

    return {
      user,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  async login(body: LoginBody): Promise<AuthSessionResponse> {
    const { email, password } = body;

    // The hash is the one column the account payload must not carry, so it is
    // compared and then dropped.
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { ...ACCOUNT_SELECT, passwordHash: true },
    });

    // One answer for an unknown address and a wrong password: which half failed
    // is not the caller's business.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { passwordHash: _passwordHash, ...account } = user;

    return {
      user: account,
      accessToken: this.signToken(account.id, account.email),
    };
  }

  async me(authorization?: string): Promise<AccountResponse> {
    const payload = this.verifyAuthorizationHeader(authorization);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: ACCOUNT_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return user;
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }

  private verifyAuthorizationHeader(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authorization.replace('Bearer ', '');

    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
