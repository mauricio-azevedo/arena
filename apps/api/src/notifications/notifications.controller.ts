import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import type {
  NotificationResponse,
  NotificationsReadResponse,
  UnreadNotificationCountResponse,
} from '@arena/contracts/notifications';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationReaderService } from './notification-reader.service';
import { NotificationWriterService } from './notification-writer.service';

@Controller('me/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly reader: NotificationReaderService,
    private readonly writer: NotificationWriterService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<NotificationResponse[]> {
    return this.reader.listForUser(user.sub);
  }

  // The two counters are the one place a response is shaped outside a service:
  // the service answers the number, the route names the field.
  @Get('unread-count')
  async unreadCount(
    @CurrentUser() user: AuthUser,
  ): Promise<UnreadNotificationCountResponse> {
    return { count: await this.reader.unreadCount(user.sub) };
  }

  @Post('read')
  async markAllRead(
    @CurrentUser() user: AuthUser,
  ): Promise<NotificationsReadResponse> {
    return { updated: await this.writer.markAllRead(user.sub) };
  }
}
