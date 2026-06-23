import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClaimsModule } from '../claims/claims.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GroupInvitesModule } from '../group-invites/group-invites.module';
import { AdminClaimsController } from './admin-claims.controller';
import { AdminClaimsService } from './admin-claims.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClaimsModule,
    NotificationsModule,
    GroupInvitesModule,
  ],
  controllers: [AdminClaimsController],
  providers: [AdminClaimsService],
})
export class AdminClaimsModule {}
