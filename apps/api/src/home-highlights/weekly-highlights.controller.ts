import { Controller, Get, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { WeeklyHighlightsReadService } from './weekly-highlights-read.service';

@Controller('home/weekly-highlights')
export class WeeklyHighlightsController {
  constructor(private readonly reader: WeeklyHighlightsReadService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getWeeklyHighlights(@CurrentUser() user?: AuthUser) {
    return this.reader.getWeeklyHighlights(user?.sub);
  }
}
