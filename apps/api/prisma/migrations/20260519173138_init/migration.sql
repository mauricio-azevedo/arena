-- CreateEnum
CREATE TYPE "GroupVisibility" AS ENUM ('PUBLIC');

-- CreateEnum
CREATE TYPE "GroupMemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MatchTeam" AS ENUM ('TEAM_A', 'TEAM_B');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "GroupVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "uses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "ratingDeviation" DOUBLE PRECISION,
    "ratingVolatility" DOUBLE PRECISION,
    "ratingMu" DOUBLE PRECISION,
    "ratingSigma" DOUBLE PRECISION,
    "ratingAlgorithm" TEXT NOT NULL DEFAULT 'BEACH_ELO_V1',
    "role" "GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "gamesA" INTEGER NOT NULL,
    "gamesB" INTEGER NOT NULL,
    "winnerTeam" "MatchTeam",
    "teamAExpected" DOUBLE PRECISION,
    "teamBExpected" DOUBLE PRECISION,
    "teamAActual" DOUBLE PRECISION,
    "teamBActual" DOUBLE PRECISION,
    "teamARatingBefore" DOUBLE PRECISION,
    "teamBRatingBefore" DOUBLE PRECISION,
    "teamARatingAfter" DOUBLE PRECISION,
    "teamBRatingAfter" DOUBLE PRECISION,
    "ratingAlgorithm" TEXT NOT NULL DEFAULT 'BEACH_ELO_V1',
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupMemberId" TEXT NOT NULL,
    "displayNameSnapshot" TEXT NOT NULL,
    "team" "MatchTeam" NOT NULL,
    "position" INTEGER NOT NULL,
    "ratingBefore" DOUBLE PRECISION NOT NULL,
    "ratingAfter" DOUBLE PRECISION NOT NULL,
    "ratingDelta" DOUBLE PRECISION NOT NULL,
    "ratingDeviationBefore" DOUBLE PRECISION,
    "ratingDeviationAfter" DOUBLE PRECISION,
    "ratingVolatilityBefore" DOUBLE PRECISION,
    "ratingVolatilityAfter" DOUBLE PRECISION,
    "ratingMuBefore" DOUBLE PRECISION,
    "ratingMuAfter" DOUBLE PRECISION,
    "ratingSigmaBefore" DOUBLE PRECISION,
    "ratingSigmaAfter" DOUBLE PRECISION,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Group_visibility_createdAt_idx" ON "Group"("visibility", "createdAt");

-- CreateIndex
CREATE INDEX "Group_name_idx" ON "Group"("name");

-- CreateIndex
CREATE INDEX "Group_createdById_idx" ON "Group"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "GroupInvite_token_key" ON "GroupInvite"("token");

-- CreateIndex
CREATE INDEX "GroupInvite_groupId_idx" ON "GroupInvite"("groupId");

-- CreateIndex
CREATE INDEX "GroupInvite_createdById_idx" ON "GroupInvite"("createdById");

-- CreateIndex
CREATE INDEX "GroupInvite_token_idx" ON "GroupInvite"("token");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_rating_idx" ON "GroupMember"("groupId", "rating");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_displayName_idx" ON "GroupMember"("groupId", "displayName");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_role_idx" ON "GroupMember"("groupId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_id_groupId_key" ON "GroupMember"("id", "groupId");

-- CreateIndex
CREATE INDEX "Match_groupId_idx" ON "Match"("groupId");

-- CreateIndex
CREATE INDEX "Match_groupId_playedAt_createdAt_idx" ON "Match"("groupId", "playedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Match_groupId_winnerTeam_idx" ON "Match"("groupId", "winnerTeam");

-- CreateIndex
CREATE INDEX "Match_groupId_ratingAlgorithm_idx" ON "Match"("groupId", "ratingAlgorithm");

-- CreateIndex
CREATE UNIQUE INDEX "Match_id_groupId_key" ON "Match"("id", "groupId");

-- CreateIndex
CREATE INDEX "MatchPlayer_matchId_idx" ON "MatchPlayer"("matchId");

-- CreateIndex
CREATE INDEX "MatchPlayer_groupId_idx" ON "MatchPlayer"("groupId");

-- CreateIndex
CREATE INDEX "MatchPlayer_groupId_playedAt_idx" ON "MatchPlayer"("groupId", "playedAt");

-- CreateIndex
CREATE INDEX "MatchPlayer_groupId_groupMemberId_idx" ON "MatchPlayer"("groupId", "groupMemberId");

-- CreateIndex
CREATE INDEX "MatchPlayer_groupId_groupMemberId_playedAt_idx" ON "MatchPlayer"("groupId", "groupMemberId", "playedAt");

-- CreateIndex
CREATE INDEX "MatchPlayer_groupMemberId_idx" ON "MatchPlayer"("groupMemberId");

-- CreateIndex
CREATE INDEX "MatchPlayer_groupMemberId_playedAt_idx" ON "MatchPlayer"("groupMemberId", "playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_groupMemberId_key" ON "MatchPlayer"("matchId", "groupMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_team_position_key" ON "MatchPlayer"("matchId", "team", "position");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_groupId_fkey" FOREIGN KEY ("matchId", "groupId") REFERENCES "Match"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_groupMemberId_groupId_fkey" FOREIGN KEY ("groupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;
