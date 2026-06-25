import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProcessingModule } from '../processing/processing.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [PrismaModule, AuthModule, ProcessingModule, MembersModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
