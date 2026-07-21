"use client";

import dynamic from "next/dynamic";
import type { ArticleSection } from "@/lib/help-data";

// ssr:false is only allowed inside "use client" components.
const TableOfContents = dynamic(() => import("./TableOfContents"), {
  ssr: false,
  loading: () => null,
});

export default function TableOfContentsWrapper({
  sections,
}: {
  sections: ArticleSection[];
}) {
  return <TableOfContents sections={sections} />;
}
