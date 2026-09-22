"use client";

import { useState, useEffect } from "react";
import TableOfContents from "./TableOfContents";

// Manual mounted check to bypass Next.js Turbopack SSG dynamic bugs
export default function TableOfContentsWrapper({
  sections,
}: React.ComponentProps<typeof TableOfContents>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <aside className="hidden xl:block w-[200px] min-w-[200px] shrink-0" />;
  }

  return (
    <div className="hidden xl:block">
      <TableOfContents sections={sections} />
    </div>
  );
}
