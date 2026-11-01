import React, { useState, useEffect, useRef } from "react";
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

// "Mon 10 May" from "2027-05-10" (falls back to the text as stored).
function niceDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return iso || "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// A round's "Contact by" and "Play by" dates: date boxes for the admin, plain text for everyone else.
function renderRoundDates(meta, roundIdx, isAdmin, onUpdateMeta, extraStyle) {
  const m = meta || {};
  if (isAdmin) {
    return (
      <div style={{ ...styles.roundDates, ...extraStyle }}>
        <label style={styles.dateLabel}>
          Contact by
          <input
            type="date"
            style={styles.dateInput}
            value={m.contactBy || ""}
            onChange={(e) => onUpdateMeta(roundIdx, "contactBy", e.target.value)}
          />
        </label>
        <label style={styles.dateLabel}>
          Play by
          <input
            type="date"
            style={styles.dateInput}
            value={m.playBy || ""}
            onChange={(e) => onUpdateMeta(roundIdx, "playBy", e.target.value)}
          />
        </label>
      </div>
    );
  }
  if (!m.contactBy && !m.playBy) return <div style={{ ...styles.roundDates, ...extraStyle }} />;
  return (
    <div style={{ ...styles.roundDates, ...extraStyle }}>
      <div style={styles.dateReadout}>
        {m.contactBy && <div>Contact by <b>{niceDate(m.contactBy)}</b></div>}
        {m.playBy && <div>Play by <b>{niceDate(m.playBy)}</b></div>}
      </div>
    </div>
  );
}

// ---------- Phone view: one round at a time ----------

// True on a phone-sized screen, where the whole draw is too wide to see.
function useIsPhone() {
  const query = "(max-width: 700px)";
  const [phone, setPhone] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = (e) => setPhone(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    setPhone(mq.matches);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return phone;
}

// The round being played now: the first one with a match that has both players but no result.
function currentRoundIdx(rounds) {
  for (let ri = 0; ri < rounds.length; ri++) {
    if (rounds[ri].some((m) => m.p1 && m.p2 && !m.winner)) return ri;
  }
  return rounds.length - 1;
}

function PhoneBracket({ rounds, roundMeta, isAdmin, onSubmitScore, onUpdateMeta }) {
  const total = rounds.length;
  const [picked, setPicked] = useState(null);
  const ri = picked === null || picked >= total ? currentRoundIdx(rounds) : picked;
  const tabsRef = useRef(null);

  // Keep the chosen tab in view (the tab row scrolls sideways on narrow phones).
  useEffect(() => {
    const row = tabsRef.current;
    const tab = row && row.querySelector('[data-on="1"]');
    if (tab) row.scrollLeft = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
  }, [ri]);

  const isBye = (m) => ri === 0 && !!m.p1 !== !!m.p2;
  const games = rounds[ri].map((m, i) => ({ m, i })).filter(({ m }) => !isBye(m));
  const byes = rounds[ri].filter(isBye).map((m) => m.p1 || m.p2);
  const finalMatch = rounds[total - 1][0];

  return (
    <div style={styles.phoneBox}>
      <div ref={tabsRef} style={styles.phoneTabs} role="tablist" aria-label="Rounds">
        {rounds.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === ri}
            data-on={i === ri ? "1" : "0"}
            style={i === ri ? { ...styles.phoneTab, ...styles.phoneTabOn } : styles.phoneTab}
            onClick={() => setPicked(i)}
          >
            {roundName(i, total)}
          </button>
        ))}
      </div>
      <div style={styles.roundLabel}>{roundName(ri, total)}</div>
      {renderRoundDates(roundMeta[ri], ri, isAdmin, onUpdateMeta, { marginBottom: 12 })}
      <div style={styles.phoneList}>
        {games.length ? (
          games.map(({ m, i }) => (
            <MatchCard
              key={ri + "-" + i}
              match={m}
              firstRound={ri === 0}
              onSubmit={(s1, s2) => onSubmitScore(ri, i, s1, s2)}
            />
          ))
        ) : (
          <div style={styles.phoneNote}>No matches in this round yet.</div>
        )}
      </div>
      {byes.length > 0 && (
        <div style={styles.phoneNote}>
          <b>Byes to the next round:</b> {byes.join(", ")}
        </div>
      )}
      {ri === total - 1 && (
        <div style={{ ...styles.champBox, marginTop: 14 }}>
          {finalMatch.winner ? <>🏆 {finalMatch.winner}</> : "TBD"}
        </div>
      )}
    </div>
  );
}

export default function Bracket({ rounds, roundMeta, isAdmin, onSubmitScore, onUpdateMeta }) {
  const isPhone = useIsPhone();
  if (isPhone) {
    return (
      <PhoneBracket rounds={rounds} roundMeta={roundMeta} isAdmin={isAdmin} onSubmitScore={onSubmitScore} onUpdateMeta={onUpdateMeta} />
    );
  }
  const totalRounds = rounds.length;
  const { leftCols, rightCols, finalMatch } = buildSides(rounds);

  // A plain function (not a component) so inputs keep focus while typing.
  const renderRound = (roundIdx, items, editableDates, side) => (
    <div style={styles.roundCol} key={side + roundIdx}>
      <div style={styles.roundLabel}>{roundName(roundIdx, totalRounds)}</div>
      {renderRoundDates(roundMeta[roundIdx], roundIdx, editableDates && isAdmin, onUpdateMeta, null)}
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
            {renderRoundDates(roundMeta[0], 0, isAdmin, onUpdateMeta, { marginBottom: 8 })}
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
          {renderRoundDates(roundMeta[totalRounds - 1], totalRounds - 1, isAdmin, onUpdateMeta, { marginBottom: 8 })}
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
        fontWeight: 700, // all names bold; the winner also gets the gold line
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
