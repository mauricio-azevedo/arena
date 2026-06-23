-- Correlate a notification to the entity it's about (e.g. the stub a CLAIM_OFFER points at)
-- so it can be resolved (marked acted) when that entity's state changes. Plain column, no FK.
ALTER TABLE "Notification" ADD COLUMN "targetGroupMemberId" TEXT;
CREATE INDEX "Notification_targetGroupMemberId_idx" ON "Notification"("targetGroupMemberId");
