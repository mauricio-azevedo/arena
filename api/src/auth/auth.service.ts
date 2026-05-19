import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

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

  async register(body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!firstName || !lastName || !email || !password) {
      throw new BadRequestException('All fields are required');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must have at least 6 characters');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
      },
      select: this.userSelect(),
    });

    return {
      user,
      accessToken: this.signToken(user.id, user.email),
    };
  }

  async login(body: { email: string; password: string }) {
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken: this.signToken(user.id, user.email),
    };
  }

  async me(authorization?: string) {
    const payload = this.verifyAuthorizationHeader(authorization);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: this.userSelect(),
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
