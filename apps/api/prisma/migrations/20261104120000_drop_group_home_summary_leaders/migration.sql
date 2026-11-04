-- The group home card never rendered a leader, so the denormalized column is dropped.
ALTER TABLE "GroupHomeSummary" DROP COLUMN "leaders";
