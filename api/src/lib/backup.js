const { getContainer } = require("./store");

// Backups are whole copies of the site's data (clubs, competitions and the
// hashed passwords), kept in their own storage container. Each backup is a
// folder named after when it was taken, e.g. "2027-05-03-0300". Only the
// newest KEEP backups are kept; older ones are deleted after each new backup.
const BACKUP_CONTAINER = "club-comps-backups";
const KEEP = 2;
const MANIFEST = "_backup.json";

function stampFor(date) {
  // 2027-05-03T03:00:12Z -> 2027-05-03-0300
  const iso = date.toISOString();
  return iso.slice(0, 10) + "-" + iso.slice(11, 13) + iso.slice(14, 16);
}

async function blobNames(container, prefix) {
  const names = [];
  for await (const b of container.listBlobsFlat(prefix ? { prefix } : undefined)) names.push(b.name);
  return names;
}

async function copyBlob(from, fromName, to, toName) {
  const buf = await from.getBlockBlobClient(fromName).downloadToBuffer();
  await to.getBlockBlobClient(toName).upload(buf, buf.length, { overwrite: true });
}

async function listBackups() {
  const backups = await getContainer(BACKUP_CONTAINER);
  const names = await blobNames(backups);
  const stamps = [...new Set(names.map((n) => n.split("/")[0]))].sort().reverse();
  const list = [];
  for (const stamp of stamps) {
    let info = { createdAt: null, items: names.filter((n) => n.startsWith(stamp + "/") && !n.endsWith(MANIFEST)).length, reason: null };
    try {
      const buf = await backups.getBlockBlobClient(`${stamp}/${MANIFEST}`).downloadToBuffer();
      info = { ...info, ...JSON.parse(buf.toString("utf-8")) };
    } catch {
      /* a backup without its manifest still counts */
    }
    list.push({ id: stamp, createdAt: info.createdAt, items: info.items, reason: info.reason });
  }
  return list;
}

// Takes a backup now, then deletes all but the newest KEEP. Returns the new backup's id.
async function runBackup(reason = "manual", now = new Date()) {
  const data = await getContainer();
  const backups = await getContainer(BACKUP_CONTAINER);
  const stamp = stampFor(now);
  const names = await blobNames(data);
  for (const name of names) await copyBlob(data, name, backups, `${stamp}/${name}`);
  const manifest = Buffer.from(JSON.stringify({ createdAt: now.toISOString(), items: names.length, reason }), "utf-8");
  await backups.getBlockBlobClient(`${stamp}/${MANIFEST}`).upload(manifest, manifest.length, { overwrite: true });

  // keep only the newest KEEP backups
  const all = await blobNames(backups);
  const stamps = [...new Set(all.map((n) => n.split("/")[0]))].sort().reverse();
  const old = new Set(stamps.slice(KEEP));
  for (const n of all) {
    if (old.has(n.split("/")[0])) await backups.getBlockBlobClient(n).deleteIfExists();
  }
  return { id: stamp, items: names.length, removed: old.size };
}

// Puts a backup back: the site's data becomes exactly what it was then.
async function restoreBackup(stamp) {
  if (!/^\d{4}-\d{2}-\d{2}-\d{4}$/.test(stamp || "")) return { ok: false, error: "bad backup" };
  const data = await getContainer();
  const backups = await getContainer(BACKUP_CONTAINER);
  const files = (await blobNames(backups, stamp + "/")).filter((n) => !n.endsWith(MANIFEST));
  if (files.length === 0) return { ok: false, error: "That backup doesn't exist." };

  const keep = new Set();
  for (const f of files) {
    const name = f.slice(stamp.length + 1);
    keep.add(name);
    await copyBlob(backups, f, data, name);
  }
  // anything added since the backup (e.g. a new club) goes too
  for (const n of await blobNames(data)) {
    if (!keep.has(n)) await data.getBlockBlobClient(n).deleteIfExists();
  }
  return { ok: true, items: files.length };
}

module.exports = { listBackups, runBackup, restoreBackup, KEEP, stampFor };
