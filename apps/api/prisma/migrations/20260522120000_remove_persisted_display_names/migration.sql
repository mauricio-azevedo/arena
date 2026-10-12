-- DropIndex
DROP INDEX IF EXISTS "GroupMember_groupId_displayName_idx";

-- AlterTable
ALTER TABLE "GroupMember" DROP COLUMN IF EXISTS "displayName";
ALTER TABLE "MatchPlayer" DROP COLUMN IF EXISTS "displayNameSnapshot";
