-- Drop the acted lifecycle. Nothing has written `actedAt` since #262 retired the
-- claim-offer flow, which owned the only caller, so every row's value is null and the
-- "settled" rendering it drove was unreachable. `targetGroupMemberId` goes with it: it
-- existed solely to find the notifications to settle. Admin revert (ADR 0004) brings the
-- notion back if and when it is built.

-- DropIndex
DROP INDEX "Notification_targetGroupMemberId_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "actedAt",
DROP COLUMN "targetGroupMemberId";
