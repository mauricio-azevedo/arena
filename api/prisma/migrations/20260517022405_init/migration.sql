-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "teamAPlayer1Id" TEXT NOT NULL,
    "teamAPlayer2Id" TEXT NOT NULL,
    "teamBPlayer1Id" TEXT NOT NULL,
    "teamBPlayer2Id" TEXT NOT NULL,
    "gamesA" INTEGER NOT NULL,
    "gamesB" INTEGER NOT NULL,
    "ratingDeltaA" DOUBLE PRECISION NOT NULL,
    "ratingDeltaB" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAPlayer1Id_fkey" FOREIGN KEY ("teamAPlayer1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAPlayer2Id_fkey" FOREIGN KEY ("teamAPlayer2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBPlayer1Id_fkey" FOREIGN KEY ("teamBPlayer1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBPlayer2Id_fkey" FOREIGN KEY ("teamBPlayer2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
