const { app } = require("@azure/functions");
const { readText, writeText, verifyAuth, canAccessClub, hasPlayersPassword, wait } = require("../lib/store");

// Only these keys can be read or written through the public API.
//   clubs                        the list of clubs            (master admin writes)
//   club__<id>__config           a club's competitions setup  (club or master admin writes)
//   club__<id>__c<n>             one competition's data       (the club's players write: they enter scores)
// Everything under club__<id> can only be read or written by that club's
// players (with its players' password), its admin or the master admin.
const KEY_OK = /^(clubs|club__[a-z0-9-]{1,40}__(config|c\d{1,3}))$/;
const MAX_VALUE_LENGTH = 1000000;

// GET requests carry the caller's password in an x-cc-auth header (base64 JSON),
// POST requests in the body.
function authFromHeader(request) {
  const raw = request.headers.get("x-cc-auth");
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// Club data must never be kept by a browser or a cache in between: whether a
// request is allowed depends on the password sent with it.
const NO_STORE = { "Cache-Control": "no-store, private", Pragma: "no-cache" };

async function needPassword(club) {
  await wait(300);
  return {
    status: 401,
    headers: NO_STORE,
    jsonBody: {
      error: "Enter your club's password.",
      needPassword: true,
      // tells the app to say "ask your club admin" rather than offer a password box that can't work
      playersPasswordSet: await hasPlayersPassword(club),
    },
  };
}

app.http("kv", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "kv",
  handler: async (request, context) => {
    try {
      if (request.method === "GET") {
        const key = request.query.get("key") || "";
        if (!KEY_OK.test(key)) return { status: 400, jsonBody: { error: "bad key" } };
        const club = key.split("__")[1];
        if (key !== "clubs" && !(await canAccessClub(authFromHeader(request), club))) {
          return needPassword(club);
        }
        const value = await readText(key);
        if (value === null) return { status: 404, headers: NO_STORE, jsonBody: { error: "not found" } };
        return { status: 200, headers: NO_STORE, jsonBody: { key, value } };
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return { status: 400, jsonBody: { error: "invalid JSON body" } };
      }
      const { key, value, auth } = body || {};
      if (!KEY_OK.test(key || "") || typeof value !== "string") {
        return { status: 400, jsonBody: { error: "bad key or value" } };
      }
      if (value.length > MAX_VALUE_LENGTH) {
        return { status: 413, jsonBody: { error: "too large" } };
      }

      if (key === "clubs") {
        const who = await verifyAuth(auth);
        if (!who || who.role !== "master") return { status: 401, jsonBody: { error: "master admin only" } };
      } else if (key.endsWith("__config")) {
        const clubId = key.split("__")[1];
        const who = await verifyAuth(auth);
        const allowed = who && (who.role === "master" || (who.role === "club" && who.club === clubId));
        if (!allowed) return { status: 401, jsonBody: { error: "club admin only" } };
      } else if (!(await canAccessClub(auth, key.split("__")[1]))) {
        return needPassword(key.split("__")[1]);
      }

      await writeText(key, value);
      return { status: 200, jsonBody: { key, ok: true } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "server error" } };
    }
  },
});
