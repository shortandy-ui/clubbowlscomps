export const MIN_COMPS = 6;
export const MAX_COMPS = 12;
export const DEFAULT_COMPS = 8;

export const configKey = (clubId) => `club__${clubId}__config`;
export const compKey = (clubId, compId) => `club__${clubId}__${compId}`;

export function emptyComp() {
  return { entrants: [], bracket: null, roundMeta: null };
}

export function defaultConfig(count = DEFAULT_COMPS) {
  return {
    comps: Array.from({ length: count }, (_, i) => ({
      id: `c${i + 1}`,
      name: `Competition ${i + 1}`,
    })),
  };
}

export function parseJson(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function uniqueSlug(name, existingIds) {
  const base = slugify(name) || "club";
  let id = base;
  let n = 2;
  while (existingIds.includes(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

// Turns pasted text (one name per line, a column or table copied from Excel,
// Word or a web page, a CSV/TXT file, or one comma-separated line) into a clean
// list of names.
//  - one entry per line; blank lines, quotes, bullets and numbering are ignored
//  - a leading column of row numbers ("1", "2"...) is dropped
//  - when a row has several columns (separated by tabs), they are joined using
//    `joiner`: " " for First name | Surname, or " & " for pairs / triples / fours
//  - one single line with commas or semicolons is split into separate names
export function parseNames(text, joiner = " & ") {
  let lines = String(text || "").split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length === 1 && !/\t/.test(nonEmpty[0]) && /[,;]/.test(nonEmpty[0])) {
    lines = nonEmpty[0].split(/[,;]/);
  }
  const rows = lines.map((line) =>
    line
      .split("\t")
      .map((cell) => cell.trim().replace(/^["']+|["']+$/g, "").trim())
      .filter(Boolean)
  );
  return rows
    .map((cells) => {
      if (cells.length > 1 && /^\d+[.)]?$/.test(cells[0])) cells = cells.slice(1); // row number column
      return cells.join(joiner);
    })
    .map((n) => n.replace(/^\s*(?:\d+\s*[.)\-:]|[-*\u2022])\s+/, "").trim())
    .filter(Boolean);
}

// True when the pasted text has more than one column (tabs between cells).
export function hasColumns(text) {
  return String(text || "")
    .split(/\r?\n/)
    .some((l) => l.split("\t").filter((c) => c.trim()).length > 1);
}

// Best guess for how to join columns: if most cells are already full names
// (contain a space) each row is a pair/team, otherwise it is First | Surname.
export function guessJoiner(text) {
  let cells = 0;
  let withSpace = 0;
  String(text || "").split(/\r?\n/).forEach((l) => {
    let c = l.split("\t").map((x) => x.trim()).filter(Boolean);
    if (c.length > 1 && /^\d+[.)]?$/.test(c[0])) c = c.slice(1);
    if (c.length > 1) c.forEach((x) => { cells++; if (/\s/.test(x)) withSpace++; });
  });
  return cells > 0 && withSpace / cells > 0.5 ? " & " : " ";
}

// Removes repeats (ignoring capitals) and anything already in `existing`.
export function dedupeNames(names, existing = []) {
  const seen = new Set(existing.map((n) => n.toLowerCase()));
  const kept = [];
  let skipped = 0;
  for (const n of names) {
    const k = n.toLowerCase();
    if (seen.has(k)) { skipped++; continue; }
    seen.add(k);
    kept.push(n);
  }
  return { kept, skipped };
}
