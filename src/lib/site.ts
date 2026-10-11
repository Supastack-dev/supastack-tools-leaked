/** Canonical repo URL — header link, per-tool source links, README. */
export const REPO_URL = "https://github.com/Learnmore-smart/supastack-tools";

/** GitHub tree URL for one tool's source folder. */
export function toolSourceUrl(slug: string): string {
  return `${REPO_URL}/tree/main/src/tools/${slug}`;
}
