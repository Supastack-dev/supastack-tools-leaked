import type { Metadata } from "next";

import { copy } from "../../tools/supabase-rls-generator/copy";
import { PageView } from "../../tools/supabase-rls-generator/page-view";

export const metadata: Metadata = {
  title: copy.metaTitle,
  description: copy.metaDescription,
};

export default function SupabaseRlsGeneratorPage() {
  return <PageView />;
}
