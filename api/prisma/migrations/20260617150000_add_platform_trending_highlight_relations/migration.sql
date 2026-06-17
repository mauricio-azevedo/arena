UPDATE "PlatformTrendingPlayer" p
SET "highlightGroupId" = NULL
WHERE p."highlightGroupId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Group" g
    WHERE g."id" = p."highlightGroupId"
);

UPDATE "PlatformTrendingPlayer" p
SET "highlightGroupMemberId" = NULL
WHERE p."highlightGroupMemberId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "GroupMember" gm
    WHERE gm."id" = p."highlightGroupMemberId"
);

CREATE INDEX "PlatformTrendingPlayer_highlightGroupId_idx"
    ON "PlatformTrendingPlayer"("highlightGroupId");

CREATE INDEX "PlatformTrendingPlayer_highlightGroupMemberId_idx"
    ON "PlatformTrendingPlayer"("highlightGroupMemberId");

ALTER TABLE "PlatformTrendingPlayer"
    ADD CONSTRAINT "PlatformTrendingPlayer_highlightGroupId_fkey"
        FOREIGN KEY ("highlightGroupId")
            REFERENCES "Group"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;

ALTER TABLE "PlatformTrendingPlayer"
    ADD CONSTRAINT "PlatformTrendingPlayer_highlightGroupMemberId_fkey"
        FOREIGN KEY ("highlightGroupMemberId")
            REFERENCES "GroupMember"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;