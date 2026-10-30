// Quick self-check: for every field size from 2 to 64, play a whole
// tournament with random results and make sure a single champion emerges.
import { generateBracket, applyScore } from "./src/draw.js";

let failures = 0;
for (let n = 2; n <= 64; n++) {
  for (let trial = 0; trial < 50; trial++) {
    const names = Array.from({ length: n }, (_, i) => "P" + (i + 1));
    let { rounds } = generateBracket(names);
    // every player appears exactly once in round 1
    const seen = rounds[0].flatMap((m) => [m.p1, m.p2]).filter(Boolean);
    if (seen.length !== n || new Set(seen).size !== n) { failures++; console.log("bad round 1", n); break; }
    // no empty matches in round 1
    if (rounds[0].some((m) => !m.p1 && !m.p2)) { failures++; console.log("empty match", n); break; }
    for (let ri = 0; ri < rounds.length; ri++) {
      for (let mi = 0; mi < rounds[ri].length; mi++) {
        const m = rounds[ri][mi];
        if (m.winner) continue;
        if (!m.p1 || !m.p2) { failures++; console.log("stuck", n, ri, mi); ri = 99; break; }
        const a = Math.floor(Math.random() * 20), b = a + 1 + Math.floor(Math.random() * 5);
        rounds = applyScore(rounds, ri, mi, Math.random() < 0.5 ? a : b, Math.random() < 0.5 ? b : a);
        if (rounds[ri][mi].score1 === rounds[ri][mi].score2) { rounds = applyScore(rounds, ri, mi, 5, 3); }
      }
    }
    const champ = rounds[rounds.length - 1][0].winner;
    if (!champ) { failures++; console.log("no champion", n); break; }
  }
}
console.log(failures === 0 ? "ALL DRAW TESTS PASSED (2-64 entrants)" : failures + " FAILURES");
process.exit(failures ? 1 : 0);
