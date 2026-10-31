const { BlobServiceClient } = require("@azure/storage-blob");
const crypto = require("crypto");

const CONTAINER_NAME = "club-comps-data";
const containerPromises = {};

// The site's data lives in "club-comps-data"; backups go in "club-comps-backups".
function getContainer(name = CONTAINER_NAME) {
  if (!containerPromises[name]) {
    const cs = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!cs) throw new Error("AZURE_STORAGE_CONNECTION_STRING is not configured");
    const container = BlobServiceClient.fromConnectionString(cs).getContainerClient(name);
    containerPromises[name] = container.createIfNotExists().then(() => container);
  }
  return containerPromises[name];
}

function blobNameFor(key) {
  return String(key).replace(/[^a-zA-Z0-9_-]/g, "_") + ".json";
}

async function readText(key) {
  const container = await getContainer();
  try {
    const buf = await container.getBlockBlobClient(blobNameFor(key)).downloadToBuffer();
    return buf.toString("utf-8");
  } catch (err) {
    if (err.statusCode === 404) return null;
    throw err;
  }
}

async function writeText(key, text) {
  const container = await getContainer();
  const data = Buffer.from(String(text), "utf-8");
  await container.getBlockBlobClient(blobNameFor(key)).upload(data, data.length, { overwrite: true });
}

// ---- passwords (stored hashed, in blobs the public API can never read) ----

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString("hex");
}

function pwKey(scope) {
  return "pw__" + scope; // scope is "master", "club__<id>" (club admin) or "players__<id>"
}

const CLUB_ID = /^[a-z0-9-]{1,40}$/;

async function setPassword(scope, password) {
  const salt = crypto.randomBytes(16).toString("hex");
  await writeText(pwKey(scope), JSON.stringify({ salt, hash: hashPassword(password, salt) }));
}

function safeEqual(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

async function checkPassword(scope, password) {
  if (typeof password !== "string" || !password) return false;
  const raw = await readText(pwKey(scope));
  if (!raw) {
    // Master only: until it is changed in the app, use the MASTER_PASSWORD
    // setting (or the built-in starter password).
    if (scope === "master") {
      const starter = process.env.MASTER_PASSWORD || "masteradmin";
      return password === starter;
    }
    return false;
  }
  const { salt, hash } = JSON.parse(raw);
  return safeEqual(hashPassword(password, salt), hash);
}

// auth = { role: "master", password }
//      | { role: "club", club, password }     (that club's admin)
//      | { role: "player", club, password }   (that club's players' password)
async function verifyAuth(auth) {
  if (!auth || typeof auth !== "object") return null;
  if (auth.role === "master") {
    return (await checkPassword("master", auth.password)) ? { role: "master" } : null;
  }
  if (auth.role === "club" && CLUB_ID.test(auth.club || "")) {
    return (await checkPassword("club__" + auth.club, auth.password))
      ? { role: "club", club: auth.club }
      : null;
  }
  if (auth.role === "player" && CLUB_ID.test(auth.club || "")) {
    return (await checkPassword("players__" + auth.club, auth.password))
      ? { role: "player", club: auth.club }
      : null;
  }
  return null;
}

async function hasPlayersPassword(club) {
  return (await readText(pwKey("players__" + club))) !== null;
}

// May this person see and enter results for this club? Its players, its admin
// and the master admin can. A club with no players' password yet is open to
// everyone (as before), until its admin sets one.
async function canAccessClub(auth, club) {
  if (!CLUB_ID.test(club || "")) return false;
  const who = await verifyAuth(auth);
  if (who && (who.role === "master" || who.club === club)) return true;
  return !(await hasPlayersPassword(club));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { getContainer, readText, writeText, setPassword, verifyAuth, canAccessClub, hasPlayersPassword, wait };
