import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedModule } from '../feed/feed.module';
import { GroupsModule } from '../groups/groups.module';
import { ProcessingModule } from '../processing/processing.module';
import { ClaimService } from './claim.service';

// Shared core of "attach an account to a stub" (performClaim/findSharedMatches/
// getStubClaimSummary), driven by the email-anchored claim confirm (claim-offers).
@Module({
  imports: [PrismaModule, FeedModule, GroupsModule, ProcessingModule],
  providers: [ClaimService],
  exports: [ClaimService],
})
export class ClaimsModule {}
