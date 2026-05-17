type RatingPlayer = {
  id: string;
  name: string;
  rating: number;
};

type MatchInput = {
  teamA: [RatingPlayer, RatingPlayer];
  teamB: [RatingPlayer, RatingPlayer];
  gamesA: number;
  gamesB: number;
};

const ELO_DIVISOR = 400;
const K_FACTOR = 32;

function averageRating(team: [RatingPlayer, RatingPlayer]) {
  return (team[0].rating + team[1].rating) / 2;
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_DIVISOR));
}

export function calculateBeachRating(match: MatchInput) {
  const teamARating = averageRating(match.teamA);
  const teamBRating = averageRating(match.teamB);

  const expectedA = expectedScore(teamARating, teamBRating);

  const totalGames = match.gamesA + match.gamesB;
  const actualA = match.gamesA / totalGames;

  const deltaA = K_FACTOR * (actualA - expectedA);
  const deltaB = -deltaA;

  return {
    teamA: {
      expected: expectedA,
      actual: actualA,
      delta: deltaA,
      players: match.teamA.map((player) => ({
        ...player,
        newRating: player.rating + deltaA,
      })),
    },
    teamB: {
      expected: 1 - expectedA,
      actual: 1 - actualA,
      delta: deltaB,
      players: match.teamB.map((player) => ({
        ...player,
        newRating: player.rating + deltaB,
      })),
    },
  };
}
