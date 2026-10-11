import { CodeXml } from "lucide-react";

import { toolSourceUrl } from "../lib/site";
import styles from "./source-link.module.css";

/** "View source" link from a tool page to its folder in this repo. */
export function SourceLink({ slug }: Readonly<{ slug: string }>) {
  return (
    <a
      className={styles.link}
      href={toolSourceUrl(slug)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <CodeXml size={13} aria-hidden />
      View source
    </a>
  );
}
