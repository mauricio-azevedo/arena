-- Retire the claim-link + request/approval machinery, replaced by the email-anchored
-- claim (GroupMember.claimEmail). ClaimRequestStatus enum dropped with its table.

-- DropTable (drops its FKs, indexes, and the partial-unique pending index)
DROP TABLE "ClaimRequest";

-- DropEnum
DROP TYPE "ClaimRequestStatus";

-- AlterTable: GroupInvite is now JOIN-only (dropping the columns drops the FK + index too)
ALTER TABLE "GroupInvite"
  DROP COLUMN "targetGroupMemberId",
  DROP COLUMN "claimedByUserId";
