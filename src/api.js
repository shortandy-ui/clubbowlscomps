// Talks to the Azure Functions in /api.

function authHeader(auth) {
  if (!auth) return {};
  const json = JSON.stringify(auth);
  return { "x-cc-auth": btoa(unescape(encodeURIComponent(json))) };
}

// Returns the stored text, or null if nothing has been saved yet.
// Throws if the server can't be reached; the error has needPassword = true
// when the club's players' password is needed (or the one given is wrong).
export async function getKey(key, auth) {
  // no-store: never reuse an earlier answer — whether it's allowed depends on the password sent
  const res = await fetch(`/api/kv?key=${encodeURIComponent(key)}`, { headers: authHeader(auth), cache: "no-store" });
  if (res.status === 404) return null;
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    const err = new Error("Enter your club's password.");
    err.needPassword = true;
    err.playersPasswordSet = body.playersPasswordSet !== false;
    throw err;
  }
  if (!res.ok) throw new Error(`Could not load data (${res.status})`);
  const data = await res.json();
  return data.value;
}

// Returns true if saved. `auth` is the club's players' password (for results),
// or an admin password (for the club list and club setup).
export async function putKey(key, value, auth) {
  try {
    const res = await fetch("/api/kv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, auth }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function login(auth) {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", auth }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// For a club admin: has this club got a players' password yet?
export async function clubInfo(auth, club) {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clubInfo", auth, club }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function setPassword(auth, target, newPassword) {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setPassword", auth, target, newPassword }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Backups (master admin): { action: "list" | "run" | "restore", id?, confirm? }
export async function backupAction(auth, body) {
  try {
    const res = await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, auth }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, ...data };
  } catch {
    return { ok: false, error: "Can't reach the server." };
  }
}
