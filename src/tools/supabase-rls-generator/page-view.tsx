import {
  ArrowRight,
  Globe,
  Inbox,
  KeyRound,
  Lock,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { SourceLink } from "../../components/source-link";
import { REPO_URL } from "../../lib/site";
import { copy } from "./copy";
import { RLS_PRESETS, type RlsPresetId } from "./logic";
import { RlsGeneratorTool } from "./tool";
import styles from "./tool.module.css";

const PRESET_ICONS: Record<RlsPresetId, LucideIcon> = {
  owner: UserRound,
  team: Users,
  "team-write": UsersRound,
  "public-read": Globe,
  "authenticated-read": KeyRound,
  "public-insert": Inbox,
  "locked-down": Lock,
};

/** Backtick-wrapped spans in explainer copy render as inline <code>. */
function prose(text: string): ReactNode[] {
  return text
    .split("`")
    .map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

export function PageView() {
  return (
    <main className={styles.page} id="main">
      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          <ShieldCheck aria-hidden />
          {copy.hero.eyebrow}
        </p>
        <h1 className={styles.title}>
          Free Supabase <span>RLS</span> policy generator
        </h1>
        <p className={styles.lede}>{copy.hero.lede}</p>
        <SourceLink slug="supabase-rls-generator" />
      </header>

      <RlsGeneratorTool />
      <noscript>
        <p className={styles.nojsNote}>{copy.tool.nojsNote}</p>
      </noscript>

      <section aria-label="About row-level security" className={styles.explainer}>
        <h2>{copy.explainer.title}</h2>
        {copy.explainer.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{prose(paragraph)}</p>
        ))}

        <h2>{copy.explainer.presetsTitle}</h2>
        <ul className={styles.presetGrid}>
          {RLS_PRESETS.map((preset) => {
            const Icon = PRESET_ICONS[preset.id];
            return (
              <li key={preset.id}>
                <Icon aria-hidden />
                <strong>{preset.label}</strong>
                <p>{preset.summary}</p>
              </li>
            );
          })}
        </ul>
        <p>{prose(copy.explainer.presetsOutro)}</p>
      </section>

      <section aria-labelledby="rls-cta" className={styles.cta}>
        <h2 id="rls-cta">{copy.cta.title}</h2>
        <p>{copy.cta.body}</p>
        <a
          className={styles.ctaButton}
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.cta.button}
          <ArrowRight aria-hidden />
        </a>
      </section>
    </main>
  );
}
