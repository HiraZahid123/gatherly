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
    return <aside className="hidden lg:block w-[260px] min-w-[260px] shrink-0" />;
  }

  return (
    <div className="hidden lg:block shrink-0">
      <HelpSidebar {...props} />
    </div>
  );
}
