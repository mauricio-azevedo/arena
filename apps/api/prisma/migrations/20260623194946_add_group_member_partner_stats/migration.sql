-- CreateTable
CREATE TABLE "GroupMemberPartnerStats" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupMemberId" TEXT NOT NULL,
    "partnerMemberId" TEXT NOT NULL,
    "matchesTogether" INTEGER NOT NULL DEFAULT 0,
    "winsTogether" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMemberPartnerStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupMemberPartnerStats_groupId_idx" ON "GroupMemberPartnerStats"("groupId");

-- CreateIndex
CREATE INDEX "GroupMemberPartnerStats_groupMemberId_winsTogether_idx" ON "GroupMemberPartnerStats"("groupMemberId", "winsTogether");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMemberPartnerStats_groupMemberId_partnerMemberId_key" ON "GroupMemberPartnerStats"("groupMemberId", "partnerMemberId");

-- AddForeignKey
ALTER TABLE "GroupMemberPartnerStats" ADD CONSTRAINT "GroupMemberPartnerStats_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberPartnerStats" ADD CONSTRAINT "GroupMemberPartnerStats_groupMemberId_groupId_fkey" FOREIGN KEY ("groupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberPartnerStats" ADD CONSTRAINT "GroupMemberPartnerStats_partnerMemberId_groupId_fkey" FOREIGN KEY ("partnerMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;
