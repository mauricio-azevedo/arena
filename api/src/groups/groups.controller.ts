import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      createdById: string;
    },
  ) {
    return this.groupsService.create(body);
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
