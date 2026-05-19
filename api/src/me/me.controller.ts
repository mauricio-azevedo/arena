import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('groups')
  @UseGuards(JwtAuthGuard)
  findMyGroups(@CurrentUser() user: AuthUser) {
    return this.meService.findMyGroups(user.sub);
  }
}
