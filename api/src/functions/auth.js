const { app } = require("@azure/functions");
const { verifyAuth, setPassword, wait } = require("../lib/store");

// POST /api/auth
//   { action: "login", auth }
//   { action: "setPassword", auth, target: { role: "master" } | { role: "club", club }, newPassword }
app.http("auth", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "auth",
  handler: async (request, context) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch {
        return { status: 400, jsonBody: { error: "invalid JSON body" } };
      }
      const { action, auth, target, newPassword } = body || {};
      const who = await verifyAuth(auth);

      if (action === "login") {
        if (!who) {
          await wait(600); // slows down password guessing
          return { status: 401, jsonBody: { ok: false } };
        }
        return { status: 200, jsonBody: { ok: true, role: who.role } };
      }

      if (action === "setPassword") {
        if (!who) {
          await wait(600);
          return { status: 401, jsonBody: { error: "not allowed" } };
        }
        if (typeof newPassword !== "string" || newPassword.trim().length < 4) {
          return { status: 400, jsonBody: { error: "password must be at least 4 characters" } };
        }
        const pw = newPassword.trim();
        if (target && target.role === "master") {
          if (who.role !== "master") return { status: 401, jsonBody: { error: "master admin only" } };
          await setPassword("master", pw);
          return { status: 200, jsonBody: { ok: true } };
        }
        if (target && target.role === "club" && /^[a-z0-9-]{1,40}$/.test(target.club || "")) {
          const allowed = who.role === "master" || (who.role === "club" && who.club === target.club);
          if (!allowed) return { status: 401, jsonBody: { error: "not allowed" } };
          await setPassword("club__" + target.club, pw);
          return { status: 200, jsonBody: { ok: true } };
        }
        return { status: 400, jsonBody: { error: "bad target" } };
      }

      return { status: 400, jsonBody: { error: "unknown action" } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "server error" } };
    }
  },
});
