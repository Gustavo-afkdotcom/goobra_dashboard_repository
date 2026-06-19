const K = 32;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateElo(
  winnerElo: number,
  loserElo: number
): { winnerNew: number; loserNew: number; delta: number } {
  const expected = expectedScore(winnerElo, loserElo);
  const delta = Math.round(K * (1 - expected));
  return {
    winnerNew: winnerElo + delta,
    loserNew: Math.max(100, loserElo - delta),
    delta,
  };
}

export function calculateEloForScores(
  player1: { id: string; elo: number; score: number },
  player2: { id: string; elo: number; score: number }
): {
  player1: { eloBefore: number; eloAfter: number };
  player2: { eloBefore: number; eloAfter: number };
  winnerId: string | null;
} {
  if (player1.score === player2.score) {
    // Draw — smaller adjustment
    const expected1 = expectedScore(player1.elo, player2.elo);
    const drawDelta1 = Math.round(K * (0.5 - expected1));
    return {
      player1: { eloBefore: player1.elo, eloAfter: player1.elo + drawDelta1 },
      player2: { eloBefore: player2.elo, eloAfter: player2.elo - drawDelta1 },
      winnerId: null,
    };
  }

  const [winner, loser] =
    player1.score > player2.score ? [player1, player2] : [player2, player1];

  const { winnerNew, loserNew } = calculateElo(winner.elo, loser.elo);

  return {
    player1: {
      eloBefore: player1.elo,
      eloAfter: player1.id === winner.id ? winnerNew : loserNew,
    },
    player2: {
      eloBefore: player2.elo,
      eloAfter: player2.id === winner.id ? winnerNew : loserNew,
    },
    winnerId: winner.id,
  };
}
