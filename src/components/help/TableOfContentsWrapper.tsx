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
    return <aside style={{ width: "200px", minWidth: "200px", flexShrink: 0 }} />;
  }

  return <TableOfContents sections={sections} />;
}
