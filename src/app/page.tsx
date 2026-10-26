import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, GitBranch } from "lucide-react";

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
          Four single-purpose utilities for the jobs every SaaS rebuilds —
          pricing pages, row level security, translation coverage, and
          theming. Extracted from{" "}
          <a href="https://supastack.dev" target="_blank" rel="noopener noreferrer">
            supastack
          </a>
          , the SaaS starter kit.
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
        <ul className={styles.reassurance} aria-label="What to expect">
          <li>
            <Check size={13} aria-hidden /> No signup
          </li>
          <li>
            <Check size={13} aria-hidden /> Nothing uploaded
          </li>
          <li>
            <Check size={13} aria-hidden /> MIT licensed
          </li>
        </ul>
      </header>

      <ul className={styles.grid} aria-label="Tools">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.slug}>
              <Link
                aria-labelledby={`tool-${tool.slug}`}
                className={styles.card}
                href={tool.href}
              >
                <div className={styles.cardHead}>
                  <span className={styles.cardIcon} aria-hidden>
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <h2 className={styles.cardTitle} id={`tool-${tool.slug}`}>
                    {tool.title}
                  </h2>
                </div>
                <span className={styles.cardTagline}>{tool.tagline}</span>
                <ul className={styles.cardPoints}>
                  {tool.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <span className={styles.cardCta}>
                  Open tool
                  <ArrowRight size={14} aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
