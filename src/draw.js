export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nextPow2(n) {
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

// Builds a knockout draw for any number of entrants (2 or more).
// Byes are always given to different first-round matches, so no match is
// ever empty and every player has a route to the final.
export function generateBracket(entrants) {
  const list = shuffle(entrants);
  const n = list.length;
  const size = nextPow2(Math.max(n, 2));
  const matchCount = size / 2;
  const byes = size - n; // always less than matchCount

  let pairs = [];
  let idx = 0;
  for (let i = 0; i < matchCount; i++) {
    if (i < byes) {
      pairs.push([list[idx++], null]);
    } else {
      const a = list[idx++];
      const b = list[idx++];
      pairs.push([a, b]);
    }
  }
  pairs = shuffle(pairs).map(([a, b]) => (Math.random() < 0.5 ? [b, a] : [a, b]));

  const round1 = pairs.map(([p1, p2]) => ({
    p1,
    p2,
    score1: null,
    score2: null,
    winner: p1 && !p2 ? p1 : !p1 && p2 ? p2 : null,
  }));

  const rounds = [round1];
  let count = matchCount / 2;
  while (count >= 1) {
    const r = [];
    for (let i = 0; i < count; i++) {
      r.push({ p1: null, p2: null, score1: null, score2: null, winner: null });
    }
    rounds.push(r);
    count /= 2;
  }

  if (rounds.length > 1) {
    rounds[0].forEach((m, i) => {
      if (m.winner) {
        const slot = i % 2 === 0 ? "p1" : "p2";
        rounds[1][Math.floor(i / 2)][slot] = m.winner;
      }
    });
  }

  const roundMeta = rounds.map(() => ({ playBy: "", contact: "" }));
  return { rounds, roundMeta };
}

// Clears everything downstream of a match whose result has changed.
export function cascadeClear(rounds, roundIdx, matchIdx) {
  let ri = roundIdx + 1;
  let mi = Math.floor(matchIdx / 2);
  let slot = matchIdx % 2 === 0 ? "p1" : "p2";
  while (ri < rounds.length) {
    const m = rounds[ri][mi];
    m[slot] = null;
    m.score1 = null;
    m.score2 = null;
    m.winner = null;
    const prev = mi;
    ri += 1;
    mi = Math.floor(prev / 2);
    slot = prev % 2 === 0 ? "p1" : "p2";
  }
}

export function roundName(roundIdx, totalRounds) {
  const fromEnd = totalRounds - roundIdx;
  if (fromEnd === 1) return "Final";
  if (fromEnd === 2) return "Semi-Final";
  if (fromEnd === 3) return "Quarter-Final";
  return `Round ${roundIdx + 1}`;
}

// Records a result and moves the winner on. Returns a new rounds array.
export function applyScore(rounds, roundIdx, matchIdx, n1, n2) {
  const next = rounds.map((r) => r.map((m) => ({ ...m })));
  const match = next[roundIdx][matchIdx];
  const prevWinner = match.winner;
  match.score1 = n1;
  match.score2 = n2;
  match.winner = n1 > n2 ? match.p1 : match.p2;
  if (roundIdx + 1 < next.length && prevWinner !== match.winner) {
    cascadeClear(next, roundIdx, matchIdx);
    const slot = matchIdx % 2 === 0 ? "p1" : "p2";
    next[roundIdx + 1][Math.floor(matchIdx / 2)][slot] = match.winner;
  }
  return next;
}
