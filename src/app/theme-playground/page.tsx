import type { Metadata } from "next";

import { copy } from "../../tools/theme-playground/copy";
import { ThemePlaygroundPageView } from "../../tools/theme-playground/page-view";

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
};

export default function ThemePlaygroundPage() {
  return <ThemePlaygroundPageView />;
}
