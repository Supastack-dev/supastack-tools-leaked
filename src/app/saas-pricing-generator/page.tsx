import type { Metadata } from "next";

import { pricingToolCopy } from "../../tools/saas-pricing-generator/copy";
import { PricingToolPageView } from "../../tools/saas-pricing-generator/page-view";

export const metadata: Metadata = {
  title: pricingToolCopy.metaTitle,
  description: pricingToolCopy.metaDescription,
};

export default function SaasPricingGeneratorPage() {
  return <PricingToolPageView />;
}
