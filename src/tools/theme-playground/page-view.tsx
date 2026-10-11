import { MonitorSmartphone, SwatchBook } from "lucide-react";

import { SourceLink } from "../../components/source-link";
import { copy } from "./copy";
import { ThemePlayground } from "./tool";
import styles from "./tool.module.css";

export function ThemePlaygroundPageView() {
  return (
    <main id="main" className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>
          <SwatchBook size={13} aria-hidden="true" />
          {copy.heroKicker}
        </p>
        <h1>{copy.heroTitle}</h1>
        <p className={styles.lede}>{copy.heroLede}</p>
        <SourceLink slug="theme-playground" />
      </header>
      <ThemePlayground />
      <section aria-labelledby="tp-how" className={styles.explainer}>
        <h2 id="tp-how">{copy.explainer.heading}</h2>
        {copy.explainer.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </section>
      <section aria-labelledby="tp-cta" className={styles.ctaCard}>
        <MonitorSmartphone aria-hidden="true" className={styles.ctaIcon} size={26} />
        <h2 id="tp-cta">{copy.ctaTitle}</h2>
        <p>{copy.ctaBody}</p>
        <a
          className={styles.ctaButton}
          data-cta="tool-theme"
          href="https://supastack.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          {copy.ctaButton}
        </a>
      </section>
    </main>
  );
}
