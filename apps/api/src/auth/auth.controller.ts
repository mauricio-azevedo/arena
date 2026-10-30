import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import {
  loginBodySchema,
  registerBodySchema,
  type LoginBody,
  type RegisterBody,
} from '@arena/contracts/auth';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerBodySchema)) body: RegisterBody,
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(loginBodySchema)) body: LoginBody) {
    return this.authService.login(body);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.me(authorization);
  }
}
