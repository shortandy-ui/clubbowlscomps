import React, { useState, useRef } from "react";
import { styles } from "./styles";
import Bracket from "./Bracket";
import { generateBracket, applyScore } from "./draw";
import { emptyComp, parseNames, dedupeNames, hasColumns, guessJoiner } from "./helpers";

// Shows one competition. `data` is the saved competition; `onSave(newData)` stores it.
export default function CompView({ name, data, isAdmin, onSave, onBack, onRename }) {
  const [entrantInput, setEntrantInput] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");
  const [joinChoice, setJoinChoice] = useState(null); // null = let the app guess
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const inputRef = useRef(null);

  const saveName = async () => {
    const n = nameDraft.trim();
    if (!n) return;
    const ok = await onRename(n);
    if (ok) setRenaming(false);
    else alert("Could not save the new name. Check your connection and try again.");
  };

  const entrants = data.entrants || [];

  const addEntrant = async () => {
    const n = entrantInput.trim();
    if (!n) return;
    setEntrantInput(""); // clear straight away so you can keep typing the next name
    onSave({ ...data, entrants: [...entrants, n] });
    inputRef.current && inputRef.current.focus();
  };

  const columns = hasColumns(bulkText);
  const joiner = joinChoice ?? guessJoiner(bulkText);
  const bulkNames = parseNames(bulkText, joiner);

  // Pasting a list or table into the single name box opens the list tool instead
  const onSinglePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (/[\r\n\t]/.test(text.trim())) {
      e.preventDefault();
      setBulkText(text);
      setBulkMsg("");
      setJoinChoice(null);
      setShowBulk(true);
    }
  };

  const loadFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBulkText(String(reader.result || ""));
      setBulkMsg("");
    };
    reader.readAsText(file);
  };

  const bulkAdd = () => {
    const { kept, skipped } = dedupeNames(bulkNames, entrants);
    if (kept.length === 0) {
      setBulkMsg(skipped ? "Those names are all in the list already." : "No names found to add.");
      return;
    }
    onSave({ ...data, entrants: [...entrants, ...kept] });
    setBulkMsg(`Added ${kept.length} name${kept.length === 1 ? "" : "s"}${skipped ? ` (${skipped} already in the list skipped)` : ""}.`);
    setBulkText("");
  };

  const bulkReplace = () => {
    const { kept, skipped } = dedupeNames(bulkNames, []);
    if (kept.length === 0) { setBulkMsg("No names found."); return; }
    if (entrants.length > 0 && !window.confirm(`Replace the current ${entrants.length} entrants with these ${kept.length}?`)) return;
    onSave({ ...data, entrants: kept });
    setBulkMsg(`List replaced: ${kept.length} name${kept.length === 1 ? "" : "s"}${skipped ? ` (${skipped} repeats skipped)` : ""}.`);
    setBulkText("");
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
      {renaming ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <input
            autoFocus
            style={{ ...styles.input, maxWidth: 360, fontSize: 18 }}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setRenaming(false); }}
            aria-label="Competition name"
          />
          <button style={styles.btnPrimary} onClick={saveName}>Save name</button>
          <button style={styles.btnGhost} onClick={() => setRenaming(false)}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <h2 style={styles.tHeading}>{name}</h2>
          {isAdmin && onRename && (
            <button style={styles.btnGhost} onClick={() => { setNameDraft(name); setRenaming(true); }}>
              Rename competition
            </button>
          )}
        </div>
      )}

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
              onPaste={onSinglePaste}
              placeholder="Player or team name"
            />
            <button style={styles.btnPrimary} onClick={addEntrant}>Add</button>
          </div>
          <div style={styles.hintText}>Press Enter to add and move straight to the next name</div>

          <button style={{ ...styles.btnGhost, marginTop: 10 }} onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? "Hide list upload" : "Add many names at once (paste or upload a list)"}
          </button>
          {showBulk && (
            <div style={styles.bulkBox}>
              <div style={styles.hintText}>
                Paste a list here — one name per line, or a column copied from Excel or Word. For pairs, triples or fours,
                copy the whole table: names in the same row are joined together (Ann &amp; Bob). Or upload a .csv or .txt file.
              </div>
              <textarea
                style={{ ...styles.textarea, marginTop: 8 }}
                rows={6}
                value={bulkText}
                onChange={(e) => { setBulkText(e.target.value); setBulkMsg(""); setJoinChoice(null); }}
                placeholder={"Ann Smith\nBob Jones\nCarol White"}
              />
              {columns && (
                <div style={styles.joinBox}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Your list has several columns. What is each row?</div>
                  <label style={styles.radioRow}>
                    <input type="radio" name="joinmode" checked={joiner === " "} onChange={() => setJoinChoice(" ")} />
                    One player — join the columns with a space (First name | Surname → "Ann Smith")
                  </label>
                  <label style={styles.radioRow}>
                    <input type="radio" name="joinmode" checked={joiner === " & "} onChange={() => setJoinChoice(" & ")} />
                    A pair / triple / four — join the columns with "&" (Ann Smith &amp; Bob Jones)
                  </label>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                <label style={{ ...styles.btnGhost, display: "inline-block" }}>
                  Upload file…
                  <input
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    style={{ display: "none" }}
                    onChange={(e) => { loadFile(e.target.files[0]); e.target.value = ""; }}
                  />
                </label>
                <span style={styles.hintText}>
                  {bulkNames.length > 0 ? `${bulkNames.length} name${bulkNames.length === 1 ? "" : "s"} found` : ""}
                </span>
              </div>
              {bulkNames.length > 0 && (
                <div style={styles.bulkPreview}>
                  {bulkNames.slice(0, 60).map((n, i) => (
                    <span key={i} style={styles.chip}>{n}</span>
                  ))}
                  {bulkNames.length > 60 && <span style={styles.hintText}>…and {bulkNames.length - 60} more</span>}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                <button style={{ ...styles.btnPrimary, opacity: bulkNames.length ? 1 : 0.5 }} disabled={!bulkNames.length} onClick={bulkAdd}>
                  Add to list
                </button>
                <button style={{ ...styles.btnGhost, opacity: bulkNames.length ? 1 : 0.5 }} disabled={!bulkNames.length} onClick={bulkReplace}>
                  Replace whole list
                </button>
              </div>
              {bulkMsg && <div style={{ ...styles.hintText, marginTop: 8, color: "#17392A", fontWeight: 600 }}>{bulkMsg}</div>}
            </div>
          )}
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
