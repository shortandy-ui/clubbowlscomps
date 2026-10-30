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
