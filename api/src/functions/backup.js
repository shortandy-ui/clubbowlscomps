const { app } = require("@azure/functions");
const crypto = require("crypto");
const { verifyAuth, wait } = require("../lib/store");
const { listBackups, runBackup, restoreBackup } = require("../lib/backup");

// POST /api/backup
//   { action: "run" }                      take a backup now (keeps the newest 2)
//       allowed with the x-backup-key header (the weekly GitHub job) or the master admin's password
//   { action: "list", auth }               the backups there are (master admin)
//   { action: "restore", auth, id, confirm: "RESTORE" }   put a backup back (master admin)
function keyMatches(request) {
  const expected = process.env.BACKUP_KEY || "";
  const given = request.headers.get("x-backup-key") || "";
  if (expected.length < 16 || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

app.http("backup", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "backup",
  handler: async (request, context) => {
    try {
      let body;
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const { action, auth } = body || {};
      const isMaster = (await verifyAuth(auth))?.role === "master";

      if (action === "run") {
        const scheduled = keyMatches(request);
        if (!scheduled && !isMaster) {
          await wait(600);
          return { status: 401, jsonBody: { error: "not allowed" } };
        }
        const result = await runBackup(scheduled ? "weekly" : "manual");
        context.log(`Backup ${result.id}: ${result.items} items, ${result.removed} old backup(s) removed`);
        return { status: 200, jsonBody: { ok: true, ...result } };
      }

      if (!isMaster) {
        await wait(600);
        return { status: 401, jsonBody: { error: "master admin only" } };
      }

      if (action === "list") {
        return { status: 200, jsonBody: { backups: await listBackups() } };
      }

      if (action === "restore") {
        if (body.confirm !== "RESTORE") return { status: 400, jsonBody: { error: "Type RESTORE to confirm." } };
        const result = await restoreBackup(body.id);
        return result.ok ? { status: 200, jsonBody: result } : { status: 400, jsonBody: { error: result.error } };
      }

      return { status: 400, jsonBody: { error: "unknown action" } };
    } catch (err) {
      context.error(err);
      return { status: 500, jsonBody: { error: "server error" } };
    }
  },
});
