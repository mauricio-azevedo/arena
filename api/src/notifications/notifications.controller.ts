import { Controller, Get, Post, UseGuards } from '@nestjs/common';
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
  list(@CurrentUser() user: AuthUser) {
    return this.reader.listForUser(user.sub);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.reader.unreadCount(user.sub) };
  }

  @Post('read')
  async markAllRead(@CurrentUser() user: AuthUser) {
    return { updated: await this.writer.markAllRead(user.sub) };
  }
}
