import { REPO_URL } from "../lib/site";
import styles from "./site-footer.module.css";

/** Footer — license + attribution, per the repo's README. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>
          <span className={styles.strong}>supastack-tools</span> — free, open-source
          tools for SaaS builders. MIT licensed.
        </p>
        <p>
          Extracted from the free tools on{" "}
          <a href="https://supastack.dev" target="_blank" rel="noopener noreferrer">
            supastack
          </a>{" "}
          ·{" "}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
