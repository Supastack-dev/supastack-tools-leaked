import type { Metadata } from "next";

import { copy } from "../../tools/i18n-key-checker/copy";
import { PageView } from "../../tools/i18n-key-checker/page-view";

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
};

export default function I18nKeyCheckerPage() {
  return <PageView />;
}
