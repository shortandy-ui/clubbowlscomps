import React, { useState } from "react";
import { styles } from "./styles";
import { MIN_COMPS, MAX_COMPS } from "./helpers";

// Club admin tools: how many competitions, their names, new season, password.
export default function ClubAdmin({ config, comps, onSaveConfig, onNewSeason, onChangePassword, playersPasswordSet, onChangePlayersPassword }) {
  const [names, setNames] = useState(config.comps.map((c) => c.name));
  const [seasonText, setSeasonText] = useState("");
  const [showSeason, setShowSeason] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [playersPw, setPlayersPw] = useState("");
  const [msg, setMsg] = useState("");

  const count = names.length;

  const setCount = (n) => {
    if (n < count) {
      const removed = config.comps.slice(n).filter((c) => (comps[c.id]?.entrants || []).length > 0);
      if (removed.length > 0) {
        const list = removed.map((c) => c.name).join(", ");
        if (!window.confirm(`Reducing the number of competitions will remove: ${list}. Their entrants and results will no longer be shown. Continue?`)) return;
      }
      setNames(names.slice(0, n));
    } else {
      const extra = Array.from({ length: n - count }, (_, i) => `Competition ${count + i + 1}`);
      setNames([...names, ...extra]);
    }
  };

  const save = async () => {
    const cleaned = names.map((n, i) => n.trim() || `Competition ${i + 1}`);
    // keep the existing id for each slot, give new slots the next free id
    const used = new Set(config.comps.map((c) => c.id));
    let next = 1;
    const newComps = cleaned.map((name, i) => {
      if (config.comps[i]) return { id: config.comps[i].id, name };
      while (used.has(`c${next}`)) next++;
      const id = `c${next}`;
      used.add(id);
      return { id, name };
    });
    const ok = await onSaveConfig({ comps: newComps });
    setMsg(ok ? "Saved." : "Could not save — check your connection and try again.");
  };

  const dirty =
    names.length !== config.comps.length || names.some((n, i) => n !== config.comps[i]?.name);

  return (
    <div style={{ ...styles.adminPanel, maxWidth: 1100, margin: "0 auto 24px" }}>
      <div style={styles.cardTitle}>Club admin</div>

      <label style={styles.fieldLabel}>
        Number of competitions ({MIN_COMPS}–{MAX_COMPS})
        <select style={{ ...styles.input, width: 120, marginTop: 4 }} value={count} onChange={(e) => setCount(Number(e.target.value))}>
          {Array.from({ length: MAX_COMPS - MIN_COMPS + 1 }, (_, i) => MIN_COMPS + i).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <div style={{ ...styles.fieldLabel, marginTop: 14 }}>Competition names — type over "Competition 1" etc. with your own names, then click Save competitions</div>
      <div style={styles.nameGrid}>
        {names.map((n, i) => (
          <input
            key={i}
            style={styles.input}
            value={n}
            onChange={(e) => {
              const copy = [...names];
              copy[i] = e.target.value;
              setNames(copy);
            }}
            aria-label={`Competition ${i + 1} name`}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
        <button style={{ ...styles.btnPrimary, opacity: dirty ? 1 : 0.6 }} onClick={save}>Save competitions</button>
        {msg && <span style={styles.hintText}>{msg}</span>}
      </div>

      <div style={{ marginTop: 22, borderTop: "1px solid #d8cfb8", paddingTop: 16 }}>
        <button style={styles.btnDanger} onClick={() => setShowSeason(!showSeason)}>
          Start a new season (clear all competitions)
        </button>
        {showSeason && (
          <div style={styles.resetBox}>
            <div style={{ marginBottom: 8 }}>
              This permanently deletes every entrant, draw and result in <b>all</b> of this club's competitions. The competition names stay. Type RESET to confirm.
            </div>
            <input style={styles.input} value={seasonText} onChange={(e) => setSeasonText(e.target.value)} placeholder="Type RESET" />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                style={{ ...styles.btnDanger, opacity: seasonText === "RESET" ? 1 : 0.5 }}
                disabled={seasonText !== "RESET"}
                onClick={async () => {
                  if (!window.confirm("Last chance — clear every competition for this club?")) return;
                  await onNewSeason();
                  setSeasonText("");
                  setShowSeason(false);
                }}
              >
                Confirm — clear everything
              </button>
              <button style={styles.btnGhost} onClick={() => setShowSeason(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 22, borderTop: "1px solid #d8cfb8", paddingTop: 16 }}>
        <div style={styles.cardTitle}>Players' password</div>
        {playersPasswordSet === false && (
          <div style={styles.warnBox}>
            This club has no players' password yet, so your members can't see its competitions.
            Set one below and give it to them.
          </div>
        )}
        <div style={{ ...styles.hintText, marginBottom: 8 }}>
          Members type this once on their phone or computer to see this club's competitions and enter their results.
          Players from other clubs can't get in without it.
          {playersPasswordSet && " A players' password is set — entering a new one here replaces it (members will be asked for the new one)."}
        </div>
        <div style={{ display: "flex", gap: 8, maxWidth: 420, marginBottom: 22 }}>
          <input style={styles.input} type="text" value={playersPw} onChange={(e) => setPlayersPw(e.target.value)}
            placeholder={playersPasswordSet ? "New players' password" : "Players' password (4+ characters)"} autoComplete="off"
            aria-label="Players' password" />
          <button
            style={styles.btnPrimary}
            onClick={async () => {
              if (playersPw.trim().length < 4) { alert("The players' password must be at least 4 characters."); return; }
              const ok = await onChangePlayersPassword(playersPw.trim());
              alert(ok ? "Players' password saved. Give it to your members." : "Could not save the players' password.");
              if (ok) setPlayersPw("");
            }}
          >
            {playersPasswordSet ? "Change" : "Set"}
          </button>
        </div>

        <div style={styles.cardTitle}>Change this club's admin password</div>
        <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
          <input style={styles.input} type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (4+ characters)" />
          <button
            style={styles.btnPrimary}
            onClick={async () => {
              if (newPw.trim().length < 4) { alert("Password must be at least 4 characters."); return; }
              const ok = await onChangePassword(newPw.trim());
              alert(ok ? "Password changed." : "Could not change the password.");
              if (ok) setNewPw("");
            }}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
