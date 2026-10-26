import { GitBranch, Wrench } from "lucide-react";
import Link from "next/link";

import { REPO_URL } from "../lib/site";
import { ThemeToggle } from "./theme-toggle";
import styles from "./site-header.module.css";

/** Minimal site chrome — repo wordmark, GitHub link, theme toggle. */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            <Wrench size={15} strokeWidth={1.8} />
          </span>
          supastack-tools
        </Link>
        <nav className={styles.nav} aria-label="Site">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
            /* The visible label is display:none under 419px, which drops it
               from the a11y tree — keep a stable name on the icon-only link. */
            aria-label="GitHub repository"
          >
            <GitBranch size={15} aria-hidden />
            <span className={styles.githubLabel}>GitHub</span>
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
