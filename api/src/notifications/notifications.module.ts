import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationReaderService } from './notification-reader.service';
import { NotificationWriterService } from './notification-writer.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationReaderService, NotificationWriterService],
  // Exported so the claim-request flow (Fase 3) can create notifications in-transaction.
  exports: [NotificationWriterService],
})
export class NotificationsModule {}
