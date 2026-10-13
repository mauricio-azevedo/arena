-- Every account must have an avatar colour (no "no choice" state). Backfill existing
-- users with a deterministic, varied palette key (so they aren't all the same), then
-- make the column NOT NULL. Keep the key list/order in sync with
-- api/src/common/avatar-color.ts and web/src/lib/avatar-color.ts.
-- `hashtext & 7` (low 3 bits → 0..7) avoids abs(INT_MIN) overflow, which would
-- abort the whole UPDATE with "integer out of range".
UPDATE "User"
SET "avatarColor" = (
  ARRAY['blue', 'green', 'teal', 'amber', 'red', 'magenta', 'violet', 'gold']
)[(hashtext("id") & 7) + 1]
WHERE "avatarColor" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatarColor" SET NOT NULL,
ALTER COLUMN "avatarColor" SET DEFAULT 'blue';
