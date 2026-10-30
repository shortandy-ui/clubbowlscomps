// Talks to the Azure Functions in /api.

// Returns the stored text, or null if nothing has been saved yet.
// Throws if the server can't be reached.
export async function getKey(key) {
  const res = await fetch(`/api/kv?key=${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load data (${res.status})`);
  const data = await res.json();
  return data.value;
}

// Returns true if saved. `auth` is only needed for the club list and club setup.
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
