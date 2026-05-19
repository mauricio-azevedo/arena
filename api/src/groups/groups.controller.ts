import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      description?: string;
    },
  ) {
    return this.groupsService.create({
      ...body,
      createdById: user.sub,
    });
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':groupId')
  findOne(@Param('groupId') groupId: string) {
    return this.groupsService.findOne(groupId);
  }
}
