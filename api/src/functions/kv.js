const { app } = require("@azure/functions");
const { readText, writeText, verifyAuth } = require("../lib/store");

// Only these keys can be read or written through the public API.
//   clubs                        the list of clubs            (master admin writes)
//   club__<id>__config           a club's competitions setup  (club or master admin writes)
//   club__<id>__c<n>             one competition's data       (anyone writes: players enter scores)
const KEY_OK = /^(clubs|club__[a-z0-9-]{1,40}__(config|c\d{1,3}))$/;
const MAX_VALUE_LENGTH = 1000000;

app.http("kv", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "kv",
  handler: async (request, context) => {
    try {
      if (request.method === "GET") {
        const key = request.query.get("key") || "";
        if (!KEY_OK.test(key)) return { status: 400, jsonBody: { error: "bad key" } };
        const value = await readText(key);
        if (value === null) return { status: 404, jsonBody: { error: "not found" } };
        return { status: 200, jsonBody: { key, value } };
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
      }

      await writeText(key, value);
      return { status: 200, jsonBody: { key, ok: true } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "server error" } };
    }
  },
});
