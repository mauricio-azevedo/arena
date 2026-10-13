-- CreateEnum
CREATE TYPE "ClaimRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ClaimRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "stubGroupMemberId" TEXT,
    "requesterUserId" TEXT NOT NULL,
    "status" "ClaimRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClaimRequest_groupId_status_idx" ON "ClaimRequest"("groupId", "status");

-- CreateIndex
CREATE INDEX "ClaimRequest_requesterUserId_idx" ON "ClaimRequest"("requesterUserId");

-- CreateIndex
CREATE INDEX "ClaimRequest_stubGroupMemberId_idx" ON "ClaimRequest"("stubGroupMemberId");

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_stubGroupMemberId_fkey" FOREIGN KEY ("stubGroupMemberId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique: at most one PENDING claim request per stub (Prisma can't express this).
CREATE UNIQUE INDEX "ClaimRequest_stub_pending_unique"
  ON "ClaimRequest" ("stubGroupMemberId")
  WHERE "status" = 'PENDING';
