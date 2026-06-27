import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProcessingModule } from '../processing/processing.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MemberProfileReaderService } from './member-profile-reader.service';

@Module({
  imports: [PrismaModule, AuthModule, ProcessingModule],
  controllers: [MembersController],
  providers: [MembersService, MemberProfileReaderService],
  exports: [MembersService],
})
export class MembersModule {}
