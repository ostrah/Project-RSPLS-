function determineWinner(move1, move2) {
  const outcomes = {
    rock: { scissors: 'wins', lizard: 'wins', rock: 'draw', paper: 'loses', spock: 'loses' },
    paper: { rock: 'wins', spock: 'wins', paper: 'draw', scissors: 'loses', lizard: 'loses' },
    scissors: { paper: 'wins', lizard: 'wins', scissors: 'draw', rock: 'loses', spock: 'loses' },
    lizard: { spock: 'wins', paper: 'wins', lizard: 'draw', rock: 'loses', scissors: 'loses' },
    spock: { scissors: 'wins', rock: 'wins', spock: 'draw', paper: 'loses', lizard: 'loses' }
  };

  const outcome = outcomes[move1][move2];

  if (outcome === 'wins') {
    return 'Player 1 Wins';
  } else if (outcome === 'loses') {
    return 'Player 2 Wins';
  } else {
    return 'Draw';
  }
}

module.exports = { determineWinner };
