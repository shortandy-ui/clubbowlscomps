import React, { useState } from "react";
import { styles } from "./styles";
import { uniqueSlug } from "./helpers";

// Master admin: add / rename / remove clubs and set their admin passwords.
export default function MasterPanel({ clubs, onSaveClubs, onSetClubPassword, onSetPlayersPassword, onChangeMasterPassword }) {
  const [newName, setNewName] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPlayersPw, setNewPlayersPw] = useState("");
  const [masterPw, setMasterPw] = useState("");
  const [busy, setBusy] = useState(false);

  const addClub = async () => {
    const name = newName.trim();
    if (!name) { alert("Enter the club name."); return; }
    if (newPw.trim().length < 4) { alert("Give the club an admin password of at least 4 characters."); return; }
    if (newPlayersPw.trim().length < 4) { alert("Give the club a players' password of at least 4 characters."); return; }
    if (newPlayersPw.trim() === newPw.trim()) { alert("Use a different password for players than for the club admin."); return; }
    setBusy(true);
    const id = uniqueSlug(name, clubs.map((c) => c.id));
    const pwOk = await onSetClubPassword(id, newPw.trim());
    if (!pwOk) { setBusy(false); alert("Could not set the club password."); return; }
    const playersOk = await onSetPlayersPassword(id, newPlayersPw.trim());
    if (!playersOk) { setBusy(false); alert("Could not set the players' password."); return; }
    const ok = await onSaveClubs([...clubs, { id, name }]);
    setBusy(false);
    if (ok) { setNewName(""); setNewPw(""); setNewPlayersPw(""); } else alert("Could not save the club list.");
  };

  const rename = async (club) => {
    const name = window.prompt("New name for this club:", club.name);
    if (!name || !name.trim()) return;
    await onSaveClubs(clubs.map((c) => (c.id === club.id ? { ...c, name: name.trim() } : c)));
  };

  const resetPw = async (club) => {
    const pw = window.prompt(`New admin password for ${club.name} (4+ characters):`);
    if (!pw) return;
    if (pw.trim().length < 4) { alert("Password must be at least 4 characters."); return; }
    const ok = await onSetClubPassword(club.id, pw.trim());
    alert(ok ? "Password updated." : "Could not update the password.");
  };

  const resetPlayersPw = async (club) => {
    const pw = window.prompt(`New players' password for ${club.name} (4+ characters). Members will be asked for it:`);
    if (!pw) return;
    if (pw.trim().length < 4) { alert("Password must be at least 4 characters."); return; }
    const ok = await onSetPlayersPassword(club.id, pw.trim());
    alert(ok ? "Players' password updated." : "Could not update the players' password.");
  };

  const remove = async (club) => {
    if (!window.confirm(`Remove "${club.name}" from the site? Its competitions will no longer be shown.`)) return;
    await onSaveClubs(clubs.filter((c) => c.id !== club.id));
  };

  return (
    <main style={styles.tournamentView}>
      <h2 style={styles.tHeading}>Master admin</h2>

      <div style={styles.adminPanel}>
        <div style={styles.cardTitle}>Clubs ({clubs.length})</div>
        {clubs.length === 0 && <div style={styles.hintText}>No clubs yet — add the first one below.</div>}
        {clubs.map((c) => (
          <div key={c.id} style={styles.clubRow}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={styles.hintText}>Link: …/#/c/{c.id}</div>
            </div>
            <button style={styles.btnGhost} onClick={() => rename(c)}>Rename</button>
            <button style={styles.btnGhost} onClick={() => resetPw(c)}>Admin password</button>
            <button style={styles.btnGhost} onClick={() => resetPlayersPw(c)}>Players' password</button>
            <button style={styles.btnDanger} onClick={() => remove(c)}>Remove</button>
          </div>
        ))}

        <div style={{ marginTop: 18, borderTop: "1px solid #d8cfb8", paddingTop: 16 }}>
          <div style={styles.cardTitle}>Add a club</div>
          <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
            <input style={styles.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Club name" />
            <input style={styles.input} type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Club admin password (4+ characters)" />
            <input style={styles.input} type="text" value={newPlayersPw} onChange={(e) => setNewPlayersPw(e.target.value)} placeholder="Players' password (4+ characters)" />
            <div style={styles.hintText}>The admin password is for whoever runs the club's competitions. The players' password is shared with the club's members so they can see the draws and enter results.</div>
            <button style={styles.btnPrimary} disabled={busy} onClick={addClub}>{busy ? "Adding…" : "Add club"}</button>
          </div>
        </div>
      </div>

      <div style={{ ...styles.adminPanel, marginTop: 18 }}>
        <div style={styles.cardTitle}>Change master password</div>
        <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
          <input style={styles.input} type="password" value={masterPw} onChange={(e) => setMasterPw(e.target.value)} placeholder="New master password" />
          <button
            style={styles.btnPrimary}
            onClick={async () => {
              if (masterPw.trim().length < 4) { alert("Password must be at least 4 characters."); return; }
              const ok = await onChangeMasterPassword(masterPw.trim());
              alert(ok ? "Master password changed." : "Could not change the password.");
              if (ok) setMasterPw("");
            }}
          >
            Update
          </button>
        </div>
      </div>
    </main>
  );
}
