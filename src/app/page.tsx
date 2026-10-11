import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";

import { REPO_URL } from "../lib/site";
import { TOOLS } from "../tools";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Free, open-source tools for SaaS builders",
};

export default function HomePage() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Open source · MIT</p>
        <h1 className={styles.title}>Free, open-source tools for SaaS builders</h1>
        <p className={styles.lede}>
          Four browser tools extracted from{" "}
          <a href="https://supastack.dev" target="_blank" rel="noopener noreferrer">
            supastack
          </a>{" "}
          — no signup, no tracking, everything runs locally in your browser.
        </p>
        <p className={styles.heroLinks}>
          <a
            className={styles.repoLink}
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitBranch size={14} aria-hidden />
            supastack-tools on GitHub
          </a>
        </p>
      </header>

      <ul className={styles.grid} aria-label="Tools">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.slug}>
              <Link className={styles.card} href={tool.href}>
                <span className={styles.cardIcon} aria-hidden>
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardTitle}>{tool.title}</span>
                  <span className={styles.cardTagline}>{tool.tagline}</span>
                </span>
                <ArrowRight className={styles.cardArrow} size={16} aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
