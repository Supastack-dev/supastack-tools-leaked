import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { SourceLink } from "../../components/source-link";
import { copy } from "./copy";
import { I18nKeyCheckerTool } from "./tool";
import styles from "./tool.module.css";

/** `code` spans inside explainer copy. */
function inlineCode(text: string): ReactNode {
  return text
    .split("`")
    .map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

export function PageView() {
  return (
    <main id="main" className={styles.page}>
      <section className={styles.hero} aria-labelledby="i18n-tool-heading">
        <h1 id="i18n-tool-heading">{copy.heroTitle}</h1>
        <p>{copy.heroIntro}</p>
        <SourceLink slug="i18n-key-checker" />
      </section>
      <I18nKeyCheckerTool />
      <noscript>
        <p className={styles.noscript}>{copy.nojsNote}</p>
      </noscript>
      <div className={styles.explainer}>
        {copy.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{inlineCode(section.body)}</p>
          </section>
        ))}
      </div>
      <section className={styles.cta} aria-labelledby="i18n-tool-cta">
        <h2 id="i18n-tool-cta">{copy.cta.heading}</h2>
        <p>{copy.cta.body}</p>
        <a href="https://supastack.dev" target="_blank" rel="noopener noreferrer" data-cta="tool-i18n">
          {copy.cta.label}
          <ArrowUpRight size={14} aria-hidden />
        </a>
      </section>
    </main>
  );
}
