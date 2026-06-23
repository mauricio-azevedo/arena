import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClaimsModule } from '../claims/claims.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimRequestsController } from './claim-requests.controller';
import { ClaimRequestsService } from './claim-requests.service';

@Module({
  imports: [PrismaModule, AuthModule, ClaimsModule, NotificationsModule],
  controllers: [ClaimRequestsController],
  providers: [ClaimRequestsService],
})
export class ClaimRequestsModule {}
