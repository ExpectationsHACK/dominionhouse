/**
 * A page that was open across a deploy is "stale": its buttons point at Server
 * Actions, and its links at script files, that only existed in the previous
 * build. Nothing is wrong with the visitor's request, so the right recovery is
 * a fresh copy of the page, not an error screen.
 */
export function isStaleDeploymentError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "UnrecognizedActionError" || error.name === "ChunkLoadError") return true;
  return /was not found on the server|failed-to-find-server-action|Loading (CSS )?chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
    error.message,
  );
}

const RELOAD_KEY = "dh:stale-reload-at";
/** Long enough that a page which fails again straight after reloading stops trying. */
const RELOAD_COOLDOWN_MS = 30_000;

/**
 * Reload once to pick up the current build. Returns false when a reload was
 * already tried moments ago, so a page that genuinely can't load doesn't loop.
 */
export function reloadForNewDeployment(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode, settings): reloading once is still right.
  }
  window.location.reload();
  return true;
}
