import sections from "../../components/page-sections.module.css";
import { SourceLink } from "../../components/source-link";
import { REPO_URL } from "../../lib/site";
import { buildCostCopy as copy } from "./copy";
import { BuildCostTool } from "./tool";
import styles from "./page-view.module.css";

export function BuildCostPageView() {
  return (
    <main id="main" className={styles.main}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1>{copy.h1}</h1>
        <p className={styles.lead}>{copy.lead}</p>
        <SourceLink slug="build-cost" />
        <noscript>
          <p className={styles.nojs}>{copy.nojsNote}</p>
        </noscript>
      </header>

      <BuildCostTool />

      <div className={`${sections.prose} ${styles.learn}`}>
        {copy.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>
              <a href={`#${section.id}`}>{section.title}</a>
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>

      <aside className={sections.articleCta}>
        <h2>{copy.cta.title}</h2>
        <p>{copy.cta.body}</p>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          {copy.cta.button}
        </a>
      </aside>
    </main>
  );
}
