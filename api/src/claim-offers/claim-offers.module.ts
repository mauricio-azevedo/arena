import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ClaimsModule } from '../claims/claims.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimOffersController } from './claim-offers.controller';
import { ClaimOffersService } from './claim-offers.service';

@Module({
  imports: [PrismaModule, AuthModule, ClaimsModule, NotificationsModule],
  controllers: [ClaimOffersController],
  providers: [ClaimOffersService],
})
export class ClaimOffersModule {}
