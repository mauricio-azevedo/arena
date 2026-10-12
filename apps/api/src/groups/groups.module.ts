import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { FeedModule } from '../feed/feed.module';
import { GroupHomeService } from './group-home.service';
import { GroupHomeSummaryService } from './group-home-summary.service';

@Module({
  imports: [PrismaModule, AuthModule, FeedModule],
  controllers: [GroupsController],
  providers: [GroupsService, GroupHomeService, GroupHomeSummaryService],
  exports: [GroupHomeSummaryService],
})
export class GroupsModule {}
