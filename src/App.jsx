import React, { useState, useEffect, useCallback, useRef } from "react";
import { getKey, putKey, login, setPassword } from "./api";
import { styles, fontCss } from "./styles";
import { configKey, compKey, emptyComp, defaultConfig, parseJson } from "./helpers";
import MasterPanel from "./MasterPanel";
import ClubAdmin from "./ClubAdmin";
import CompView from "./CompView";

// ---- simple hash routing so every club / competition has its own link ----
//   #/                 list of clubs
//   #/c/<club>         a club's competitions
//   #/c/<club>/<comp>  one competition
//   #/master           master admin
function parseHash() {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "master") return { view: "master" };
  if (parts[0] === "c" && parts[1]) {
    return parts[2]
      ? { view: "comp", club: parts[1], comp: parts[2] }
      : { view: "club", club: parts[1] };
  }
  return { view: "clubs" };
}

function Logo() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="26" cy="26" r="24" fill="#AC8347" stroke="#D9B87A" strokeWidth="2" />
      <circle cx="23" cy="29" r="12" fill="#17392A" />
      <circle cx="23" cy="29" r="5" fill="none" stroke="#D9B87A" strokeWidth="1.5" />
      <circle cx="39" cy="14" r="4.5" fill="#FDFBF6" />
    </svg>
  );
}

function LoginCard({ title, hint, onSubmit, onCancel }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!pw) return;
    setBusy(true);
    const ok = await onSubmit(pw);
    setBusy(false);
    if (!ok) setErr("Incorrect password.");
  };

  return (
    <div style={styles.centerBox}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>{title}</div>
        {hint && <div style={{ ...styles.hintText, marginBottom: 8 }}>{hint}</div>}
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          style={styles.input}
        />
        {err && <div style={styles.errText}>{err}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button style={styles.btnPrimary} onClick={submit} disabled={busy}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          {onCancel && <button style={styles.btnGhost} onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(parseHash());
  const [clubs, setClubs] = useState(null);
  const [clubData, setClubData] = useState(null); // { id, config, comps }
  const [clubLoading, setClubLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [auth, setAuth] = useState(null); // { role, club?, password }
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (hash) => {
    window.location.hash = hash;
    window.scrollTo(0, 0);
  };

  // load the list of clubs
  useEffect(() => {
    (async () => {
      try {
        setClubs(parseJson(await getKey("clubs"), []));
      } catch (e) {
        setClubs([]);
        setLoadError("Could not load the clubs. Please refresh the page.");
      }
    })();
  }, []);

  // load a club's setup and competitions whenever the club in the link changes
  useEffect(() => {
    if (!route.club) {
      setClubData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setClubLoading(true);
      setLoadError("");
      try {
        const cfg = parseJson(await getKey(configKey(route.club)), null) || defaultConfig();
        const entries = await Promise.all(
          cfg.comps.map(async (c) => [
            c.id,
            parseJson(await getKey(compKey(route.club, c.id)), null) || emptyComp(),
          ])
        );
        if (!cancelled) setClubData({ id: route.club, config: cfg, comps: Object.fromEntries(entries) });
      } catch (e) {
        if (!cancelled) setLoadError("Could not load this club. Please refresh the page.");
      } finally {
        if (!cancelled) setClubLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [route.club]);

  const club = clubs && route.club ? clubs.find((c) => c.id === route.club) : null;
  const isClubAdmin = !!auth && !!route.club && (auth.role === "master" || auth.club === route.club);
  const isMaster = !!auth && auth.role === "master";

  const doClubLogin = async (pw) => {
    const asClub = { role: "club", club: route.club, password: pw };
    if (await login(asClub)) { setAuth(asClub); setShowLogin(false); return true; }
    const asMaster = { role: "master", password: pw };
    if (await login(asMaster)) { setAuth(asMaster); setShowLogin(false); return true; }
    return false;
  };

  const doMasterLogin = async (pw) => {
    const a = { role: "master", password: pw };
    if (await login(a)) { setAuth(a); return true; }
    return false;
  };

  // ---- saving ----
  // Saves for a competition go through a queue, so quick changes are written
  // to the server in order and the newest version always wins.
  const saveQueue = useRef({});
  const saveComp = useCallback(
    async (compId, next) => {
      setClubData((d) => ({ ...d, comps: { ...d.comps, [compId]: next } }));
      const clubId = route.club;
      const q = (saveQueue.current[clubId + compId] ||= { pending: null, running: false });
      q.pending = next;
      if (q.running) return;
      q.running = true;
      let ok = true;
      while (q.pending) {
        const value = q.pending;
        q.pending = null;
        ok = await putKey(compKey(clubId, compId), JSON.stringify(value));
      }
      q.running = false;
      setSaveError(ok ? "" : "Could not save — your last change may be lost. Check your connection.");
    },
    [route.club]
  );

  const saveConfig = async (cfg) => {
    const ok = await putKey(configKey(route.club), JSON.stringify(cfg), auth);
    if (!ok) return false;
    setClubData((d) => {
      const comps = {};
      cfg.comps.forEach((c) => (comps[c.id] = d.comps[c.id] || emptyComp()));
      return { ...d, config: cfg, comps };
    });
    return true;
  };

  const newSeason = async () => {
    const blank = emptyComp();
    const results = await Promise.all(
      clubData.config.comps.map((c) => putKey(compKey(route.club, c.id), JSON.stringify(blank)))
    );
    setClubData((d) => {
      const comps = {};
      d.config.comps.forEach((c) => (comps[c.id] = emptyComp()));
      return { ...d, comps };
    });
    setSaveError(results.every(Boolean) ? "" : "Some competitions could not be cleared — please try again.");
  };

  const saveClubs = async (list) => {
    const ok = await putKey("clubs", JSON.stringify(list), auth);
    if (ok) setClubs(list);
    return ok;
  };

  const changeClubPassword = async (pw) => {
    const ok = await setPassword(auth, { role: "club", club: route.club }, pw);
    if (ok && auth.role === "club") setAuth({ ...auth, password: pw });
    return ok;
  };

  const setClubPasswordFor = (clubId, pw) => setPassword(auth, { role: "club", club: clubId }, pw);

  const changeMasterPassword = async (pw) => {
    const ok = await setPassword(auth, { role: "master" }, pw);
    if (ok) setAuth({ ...auth, password: pw });
    return ok;
  };

  // ---- header ----
  const headerSubtitle = club ? club.name : route.view === "master" ? "Master admin" : "Knockout competitions";
  const adminButton = () => {
    if (route.view === "master") {
      return isMaster ? (
        <button style={styles.adminToggle} onClick={() => { setAuth(null); go("#/"); }}>Exit admin</button>
      ) : null;
    }
    if (route.club) {
      return isClubAdmin ? (
        <button style={styles.adminToggle} onClick={() => setAuth(null)}>Exit admin</button>
      ) : (
        <button style={styles.adminToggle} onClick={() => setShowLogin(true)}>Admin</button>
      );
    }
    return (
      <button style={styles.adminToggle} onClick={() => go("#/master")}>
        {isMaster ? "Master admin" : "Master login"}
      </button>
    );
  };

  // ---- page body ----
  let body;
  if (clubs === null) {
    body = <div style={styles.emptyState}>Loading…</div>;
  } else if (route.view === "master") {
    body = isMaster ? (
      <MasterPanel
        clubs={clubs}
        onSaveClubs={saveClubs}
        onSetClubPassword={setClubPasswordFor}
        onChangeMasterPassword={changeMasterPassword}
      />
    ) : (
      <LoginCard title="Master admin sign-in" onSubmit={doMasterLogin} onCancel={() => go("#/")} />
    );
  } else if (route.club && !club) {
    body = (
      <div style={styles.centerBox}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Club not found</div>
          <div style={styles.hintText}>This link doesn't match any club on the site.</div>
          <button style={{ ...styles.btnPrimary, marginTop: 12 }} onClick={() => go("#/")}>See all clubs</button>
        </div>
      </div>
    );
  } else if (route.club && (clubLoading || !clubData || clubData.id !== route.club)) {
    body = <div style={styles.emptyState}>Loading {club.name}…</div>;
  } else if (route.view === "comp") {
    const comp = clubData.config.comps.find((c) => c.id === route.comp);
    body = comp ? (
      <CompView
        name={comp.name}
        data={clubData.comps[comp.id] || emptyComp()}
        isAdmin={isClubAdmin}
        onSave={(next) => saveComp(comp.id, next)}
        onBack={() => go(`#/c/${route.club}`)}
        onRename={(newName) =>
          saveConfig({
            comps: clubData.config.comps.map((c) => (c.id === comp.id ? { ...c, name: newName } : c)),
          })
        }
      />
    ) : (
      <div style={styles.emptyState}>That competition doesn't exist.</div>
    );
  } else if (route.view === "club") {
    body = (
      <>
        {isClubAdmin && (
          <div style={{ padding: "20px 16px 0" }}>
            <ClubAdmin
              key={clubData.config.comps.map((c) => c.id + c.name).join("|")}
              config={clubData.config}
              comps={clubData.comps}
              onSaveConfig={saveConfig}
              onNewSeason={newSeason}
              onChangePassword={changeClubPassword}
            />
          </div>
        )}
        <main style={styles.grid}>
          {clubData.config.comps.map((c) => {
            const t = clubData.comps[c.id] || emptyComp();
            const champ = t.bracket && t.bracket.length ? t.bracket[t.bracket.length - 1][0].winner : null;
            return (
              <button key={c.id} className="cc-tcard" style={styles.tCard} onClick={() => go(`#/c/${route.club}/${c.id}`)}>
                <div style={styles.tCardName}>{c.name}</div>
                <div style={styles.tCardMeta}>
                  {t.entrants.length} entrant{t.entrants.length === 1 ? "" : "s"}
                  {t.bracket ? " · draw made" : " · no draw yet"}
                </div>
                {champ && <div style={styles.tCardChamp}>🏆 {champ}</div>}
              </button>
            );
          })}
        </main>
      </>
    );
  } else {
    body = (
      <>
        <div style={{ maxWidth: 1100, margin: "24px auto 0", padding: "0 16px" }}>
          <h2 style={styles.tHeading}>Choose your club</h2>
        </div>
        {clubs.length === 0 ? (
          <div style={{ ...styles.emptyState, maxWidth: 1068, margin: "0 auto" }}>
            No clubs have been added yet. The master admin can add them using "Master login" at the top of the page.
          </div>
        ) : (
          <main style={{ ...styles.grid, paddingTop: 0 }}>
            {clubs.map((c) => (
              <button key={c.id} className="cc-tcard" style={styles.tCard} onClick={() => go(`#/c/${c.id}`)}>
                <div style={styles.tCardName}>{c.name}</div>
                <div style={styles.tCardMeta}>View competitions →</div>
              </button>
            ))}
          </main>
        )}
      </>
    );
  }

  return (
    <div className="cc-app" style={styles.app}>
      <style>{fontCss}</style>
      <header className="cc-grass" style={styles.header}>
        <div style={styles.headerInner}>
          <button style={styles.logoBtn} onClick={() => go("#/")} aria-label="Home">
            <Logo />
          </button>
          <div>
            <div style={styles.title}>Bowls Club Competitions</div>
            <div style={styles.subtitle}>{headerSubtitle}</div>
          </div>
          {adminButton()}
        </div>
      </header>

      {(saveError || loadError) && <div style={styles.errorBanner}>{saveError || loadError}</div>}

      {showLogin && route.club && !isClubAdmin ? (
        <LoginCard
          title="Admin sign-in"
          hint={club ? club.name : ""}
          onSubmit={doClubLogin}
          onCancel={() => setShowLogin(false)}
        />
      ) : (
        body
      )}
    </div>
  );
}
