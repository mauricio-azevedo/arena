-- Retire the email-anchored claim. ADR 0004 replaced it with open/closed guest invites
-- and the admin side went then, so no anchor and no CLAIM_* notification can be created
-- any more. The recipient routes and screen are gone too (this PR), which leaves these
-- rows unreachable: a pending anchor names a guest nobody can act on, and a CLAIM_OFFER
-- deep-links to a page that no longer exists.

-- Drop the notifications of the retired flows first: the enum below is rebuilt, and the
-- cast would fail on any row still holding one of the values it loses.
DELETE FROM "Notification"
WHERE "type" IN (
  'CLAIM_OFFER',
  'CLAIM_OFFER_DECLINED',
  'CLAIM_REQUEST',
  'CLAIM_APPROVED',
  'CLAIM_DECLINED',
  'CLAIM_INVITE'
);

-- AlterEnum: Postgres cannot remove a value in place, so the type is recreated.
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('GUEST_TAKEN_OVER');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropIndex
DROP INDEX "GroupMember_claimEmail_idx";

-- DropIndex
DROP INDEX "GroupMember_groupId_claimEmail_key";

-- AlterTable: the anchor itself. Any still-pending address goes with the column — the
-- flow that could resolve it no longer exists.
ALTER TABLE "GroupMember" DROP COLUMN "claimEmail",
DROP COLUMN "claimEmailNotifiedAt",
DROP COLUMN "claimEmailStatus";

-- DropEnum
DROP TYPE "ClaimEmailStatus";
