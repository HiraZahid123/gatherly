"use client";

import { useState, useEffect } from "react";
import HelpSidebar from "./HelpSidebar";

// Manual mounted check to ensure HelpSidebar (and its hooks) only run on the client,
// bypassing any next/dynamic Turbopack SSG bugs.
export default function HelpSidebarWrapper(
  props: React.ComponentProps<typeof HelpSidebar>
) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <aside style={{ width: "260px", minWidth: "260px", flexShrink: 0 }} />;
  }

  return <HelpSidebar {...props} />;
}
