import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembersService } from './members.service';
import { MemberProfileReaderService } from './member-profile-reader.service';

@Controller('groups/:groupId/members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly memberProfileReader: MemberProfileReaderService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { userId: string },
  ) {
    return this.membersService.create(groupId, user.sub, body);
  }

  @Post('guest')
  @UseGuards(JwtAuthGuard)
  createGuest(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string },
  ) {
    return this.membersService.createGuest(groupId, user.sub, body);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.membersService.findAll(groupId);
  }

  @Get(':memberId/profile')
  getProfile(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.memberProfileReader.getMemberProfile(groupId, memberId);
  }

  @Post(':memberId/unlink')
  @UseGuards(JwtAuthGuard)
  unlink(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membersService.unlinkAccount(groupId, memberId, user.sub);
  }

  // Remove a member from the group (admin only). Soft-leave: history is preserved.
  @Delete(':memberId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.membersService.removeMember(groupId, memberId, user.sub);
  }
}
