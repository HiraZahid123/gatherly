"use client";

import dynamic from "next/dynamic";

// ssr:false is only allowed inside "use client" components.
// This wrapper lets server-component pages safely include HelpSidebar
// without triggering the "Cannot read properties of null (useState)" SSG crash.
const HelpSidebar = dynamic(() => import("./HelpSidebar"), {
  ssr: false,
  loading: () => (
    <aside style={{ width: "260px", minWidth: "260px", flexShrink: 0 }} />
  ),
});

export default function HelpSidebarWrapper(
  props: React.ComponentProps<typeof HelpSidebar>
) {
  return <HelpSidebar {...props} />;
}
