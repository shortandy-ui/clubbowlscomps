import React, { useState, useEffect } from "react";
import { styles } from "./styles";
import { roundName } from "./draw";

function buildSides(rounds) {
  const totalRounds = rounds.length;
  if (totalRounds === 1) {
    return { leftCols: [], rightCols: [], finalMatch: rounds[0][0] };
  }
  const leftCols = [];
  const rightCols = [];
  for (let ri = 0; ri < totalRounds - 1; ri++) {
    const round = rounds[ri];
    const half = round.length / 2;
    leftCols.push({
      roundIdx: ri,
      items: round.slice(0, half).map((m, i) => ({ match: m, matchIdx: i })),
    });
    rightCols.unshift({
      roundIdx: ri,
      items: round.slice(half).map((m, i) => ({ match: m, matchIdx: i + half })),
    });
  }
  return { leftCols, rightCols, finalMatch: rounds[totalRounds - 1][0] };
}

export default function Bracket({ rounds, roundMeta, isAdmin, onSubmitScore, onUpdateMeta }) {
  const totalRounds = rounds.length;
  const { leftCols, rightCols, finalMatch } = buildSides(rounds);

  // A plain function (not a component) so inputs keep focus while typing.
  const renderRound = (roundIdx, items, editableDates, side) => (
    <div style={styles.roundCol} key={side + roundIdx}>
      <div style={styles.roundLabel}>{roundName(roundIdx, totalRounds)}</div>
      <div style={styles.roundDates}>
        {editableDates && isAdmin ? (
          <>
            <label style={styles.dateLabel}>
              Play by
              <input
                type="date"
                style={styles.dateInput}
                value={roundMeta[roundIdx].playBy}
                onChange={(e) => onUpdateMeta(roundIdx, "playBy", e.target.value)}
              />
            </label>
            <label style={styles.dateLabel}>
              Contact
              <input
                key={"contact" + roundIdx + roundMeta[roundIdx].contact}
                type="text"
                style={styles.dateInput}
                defaultValue={roundMeta[roundIdx].contact}
                onBlur={(e) => {
                  if (e.target.value !== roundMeta[roundIdx].contact) {
                    onUpdateMeta(roundIdx, "contact", e.target.value);
                  }
                }}
                placeholder="Contact name"
              />
            </label>
          </>
        ) : (
          (roundMeta[roundIdx].playBy || roundMeta[roundIdx].contact) && (
            <div style={styles.dateReadout}>
              {roundMeta[roundIdx].playBy && <div>Play by {roundMeta[roundIdx].playBy}</div>}
              {roundMeta[roundIdx].contact && <div>Contact: {roundMeta[roundIdx].contact}</div>}
            </div>
          )
        )}
      </div>
      <div
        className={side === "l" ? "cc-col-left" : "cc-col-right"}
        style={{ ...styles.matchesCol, justifyContent: "space-around" }}
      >
        {items.map(({ match, matchIdx }) => (
          <MatchCard
            key={matchIdx}
            match={match}
            firstRound={roundIdx === 0}
            onSubmit={(s1, s2) => onSubmitScore(roundIdx, matchIdx, s1, s2)}
          />
        ))}
      </div>
    </div>
  );

  // The date row only shows on the left half; the right half mirrors it.
  // When a draw has just one round, show only the final.
  if (totalRounds === 1) {
    return (
      <div className="cc-bracket-scroll" style={styles.bracketScroll}>
        <div style={{ ...styles.bracketRow, justifyContent: "center" }}>
          <div style={styles.roundCol}>
            <div style={styles.roundLabel}>Final</div>
            <MatchCard match={finalMatch} onSubmit={(s1, s2) => onSubmitScore(0, 0, s1, s2)} />
            <div style={styles.champBox}>
              {finalMatch.winner ? <>🏆 {finalMatch.winner}</> : "TBD"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-bracket-scroll" style={styles.bracketScroll}>
      <div style={{ ...styles.bracketRow, alignItems: "center" }}>
        {leftCols.map((c) => renderRound(c.roundIdx, c.items, true, "l"))}
        <div className="cc-final-col" style={styles.finalCol}>
          <div style={styles.roundLabel}>Final</div>
          {isAdmin ? (
            <div style={{ ...styles.roundDates, marginBottom: 8 }}>
              <label style={styles.dateLabel}>
                Play by
                <input
                  type="date"
                  style={styles.dateInput}
                  value={roundMeta[totalRounds - 1].playBy}
                  onChange={(e) => onUpdateMeta(totalRounds - 1, "playBy", e.target.value)}
                />
              </label>
              <label style={styles.dateLabel}>
                Contact
                <input
                  key={"contactF" + roundMeta[totalRounds - 1].contact}
                  type="text"
                  style={styles.dateInput}
                  defaultValue={roundMeta[totalRounds - 1].contact}
                  onBlur={(e) => {
                    if (e.target.value !== roundMeta[totalRounds - 1].contact) {
                      onUpdateMeta(totalRounds - 1, "contact", e.target.value);
                    }
                  }}
                  placeholder="Contact name"
                />
              </label>
            </div>
          ) : (
            (roundMeta[totalRounds - 1].playBy || roundMeta[totalRounds - 1].contact) && (
              <div style={{ ...styles.dateReadout, textAlign: "center", marginBottom: 8 }}>
                {roundMeta[totalRounds - 1].playBy && <div>Play by {roundMeta[totalRounds - 1].playBy}</div>}
                {roundMeta[totalRounds - 1].contact && <div>Contact: {roundMeta[totalRounds - 1].contact}</div>}
              </div>
            )
          )}
          <MatchCard
            match={finalMatch}
            onSubmit={(s1, s2) => onSubmitScore(totalRounds - 1, 0, s1, s2)}
          />
          <div style={styles.champBox}>
            {finalMatch.winner ? <>🏆 {finalMatch.winner}</> : "TBD"}
          </div>
        </div>
        {rightCols.map((c) => renderRound(c.roundIdx, c.items, false, "r"))}
      </div>
    </div>
  );
}

function MatchCard({ match, onSubmit, firstRound = false }) {
  const [s1, setS1] = useState(match.score1 ?? "");
  const [s2, setS2] = useState(match.score2 ?? "");
  // Only a first-round gap is a bye; later on it just means the opponent isn't known yet.
  const bye = firstRound && ((match.p1 && !match.p2) || (!match.p1 && match.p2));
  const editable = match.p1 && match.p2 && !bye;

  useEffect(() => {
    setS1(match.score1 ?? "");
    setS2(match.score2 ?? "");
  }, [match.score1, match.score2]);

  return (
    <div className="cc-match" style={{ ...styles.matchCard, opacity: match.p1 || match.p2 ? 1 : 0.45 }}>
      <span className="cc-jack" />
      <PlayerRow name={match.p1} won={match.winner && match.winner === match.p1} trophy={!bye} score={match.score1} />
      <div style={styles.vsDivider} />
      <PlayerRow name={match.p2} won={match.winner && match.winner === match.p2} trophy={!bye} score={match.score2} />
      {bye && <div style={styles.byeTag}>bye</div>}
      {editable && (
        <div style={styles.scoreRow}>
          <input
            style={styles.scoreInput}
            value={s1}
            onChange={(e) => setS1(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            aria-label="Top player score"
          />
          <span style={{ color: "#8a8371" }}>–</span>
          <input
            style={styles.scoreInput}
            value={s2}
            onChange={(e) => setS2(e.target.value)}
            inputMode="numeric"
            placeholder="0"
            aria-label="Bottom player score"
          />
          <button style={styles.scoreBtn} onClick={() => onSubmit(s1, s2)}>
            {match.winner ? "Update" : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}

function PlayerRow({ name, won, trophy, score }) {
  return (
    <div
      style={{
        ...styles.playerRow,
        fontWeight: won ? 700 : 400,
        color: won ? "#17392A" : "#3a362c",
        borderBottom: won ? "2px solid #AC8347" : "2px solid transparent",
      }}
    >
      <span>
        {won && trophy ? "🏆 " : ""}
        {name || "—"}
      </span>
      {name && score !== "" && score != null && <span style={styles.scoreDigit}>{score}</span>}
    </div>
  );
}
