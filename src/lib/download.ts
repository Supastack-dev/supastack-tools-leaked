/**
 * Trigger a browser download of generated text — used for .sql migrations
 * and report exports. Everything stays client-side (Blob + object URL).
 */
export function downloadText(filename: string, text: string, mime = "text/plain"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick — some browsers cancel the download if the URL
  // dies inside the same task as the click.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
