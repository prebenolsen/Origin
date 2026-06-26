/**
 * Tiny localStorage store for the Geography Challenge: which regions the learner
 * has already named, per board. Kept separate from the per-module progress so
 * the two never collide.
 */
const KEY = 'origin:geo:v1';

type Store = Record<string, string[]>;

function read(): Store {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function getSolved(board: string): Set<string> {
  return new Set(read()[board] ?? []);
}

export function saveSolved(board: string, ids: Set<string>): void {
  const store = read();
  store[board] = [...ids];
  write(store);
}
