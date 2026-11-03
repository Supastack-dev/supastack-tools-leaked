import type { Metadata } from "next";

import { buildCostCopy } from "../../tools/build-cost/copy";
import { BuildCostPageView } from "../../tools/build-cost/page-view";

export const metadata: Metadata = {
  title: buildCostCopy.metaTitle,
  description: buildCostCopy.metaDescription,
};

export default function SaasBuildCostCalculatorPage() {
  return <BuildCostPageView />;
}
