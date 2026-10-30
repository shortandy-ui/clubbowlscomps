import React, { useState, useRef } from "react";
import { styles } from "./styles";
import Bracket from "./Bracket";
import { generateBracket, applyScore } from "./draw";
import { emptyComp } from "./helpers";

// Shows one competition. `data` is the saved competition; `onSave(newData)` stores it.
export default function CompView({ name, data, isAdmin, onSave, onBack }) {
  const [entrantInput, setEntrantInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const inputRef = useRef(null);

  const entrants = data.entrants || [];

  const addEntrant = async () => {
    const n = entrantInput.trim();
    if (!n) return;
    setEntrantInput(""); // clear straight away so you can keep typing the next name
    onSave({ ...data, entrants: [...entrants, n] });
    inputRef.current && inputRef.current.focus();
  };

  const removeEntrant = (idx) => {
    const list = [...entrants];
    list.splice(idx, 1);
    onSave({ ...data, entrants: list });
  };

  const doDraw = () => {
    if (entrants.length < 2) {
      alert("You need at least 2 entrants to make a draw.");
      return;
    }
    if (data.bracket && !window.confirm("A draw already exists. Redraw and lose all current results?")) return;
    const { rounds, roundMeta } = generateBracket(entrants);
    onSave({ ...data, bracket: rounds, roundMeta });
  };

  const submitScore = (roundIdx, matchIdx, s1, s2) => {
    const n1 = Number(s1);
    const n2 = Number(s2);
    if (s1 === "" || s2 === "" || Number.isNaN(n1) || Number.isNaN(n2) || n1 === n2) {
      alert("Enter two different scores — a knockout match can't be a draw.");
      return;
    }
    onSave({ ...data, bracket: applyScore(data.bracket, roundIdx, matchIdx, n1, n2) });
  };

  const updateMeta = (roundIdx, field, value) => {
    const roundMeta = data.roundMeta.map((r) => ({ ...r }));
    roundMeta[roundIdx][field] = value;
    onSave({ ...data, roundMeta });
  };

  const resetComp = async () => {
    if (resetText !== "RESET") return;
    if (!window.confirm(`Really wipe all entrants and results for "${name}"? This cannot be undone.`)) return;
    await onSave(emptyComp());
    setResetText("");
    setShowReset(false);
  };

  return (
    <main style={styles.tournamentView}>
      <button style={styles.backLink} onClick={onBack}>← All competitions</button>
      <h2 style={styles.tHeading}>{name}</h2>

      {isAdmin && (
        <div style={styles.adminPanel}>
          <div style={styles.cardTitle}>Entrants ({entrants.length})</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              style={styles.input}
              value={entrantInput}
              onChange={(e) => setEntrantInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntrant()}
              placeholder="Player or team name"
            />
            <button style={styles.btnPrimary} onClick={addEntrant}>Add</button>
          </div>
          <div style={styles.hintText}>Press Enter to add and move straight to the next name</div>
          {data.bracket && (
            <div style={styles.noteBox}>
              A draw has already been made. Changing the entrants won't change it until you click Redraw.
            </div>
          )}
          {entrants.length > 0 && (
            <ul style={styles.entrantList}>
              {entrants.map((n, idx) => (
                <li key={idx} style={styles.entrantItem}>
                  <span>{n}</span>
                  <button style={styles.entrantRemove} onClick={() => removeEntrant(idx)} aria-label={`Remove ${n}`}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button style={styles.btnAccent} onClick={doDraw}>
              {data.bracket ? "Redraw" : "Random draw"}
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <button style={styles.btnDanger} onClick={() => setShowReset(!showReset)}>
              Remove all data for next year
            </button>
            {showReset && (
              <div style={styles.resetBox}>
                <div style={{ marginBottom: 8 }}>
                  This permanently deletes the entrants and results for <b>{name}</b>. Type RESET to confirm.
                </div>
                <input
                  style={styles.input}
                  value={resetText}
                  onChange={(e) => setResetText(e.target.value)}
                  placeholder="Type RESET"
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    style={{ ...styles.btnDanger, opacity: resetText === "RESET" ? 1 : 0.5 }}
                    disabled={resetText !== "RESET"}
                    onClick={resetComp}
                  >
                    Confirm reset
                  </button>
                  <button style={styles.btnGhost} onClick={() => setShowReset(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!data.bracket && (
        <div style={styles.emptyState}>
          No draw has been made for this competition yet.
          {isAdmin
            ? " Add the entrants above and click Random draw."
            : " Check back once the admin has entered the players and made the draw."}
        </div>
      )}

      {data.bracket && (
        <Bracket
          rounds={data.bracket}
          roundMeta={data.roundMeta}
          isAdmin={isAdmin}
          onSubmitScore={submitScore}
          onUpdateMeta={updateMeta}
        />
      )}
    </main>
  );
}
