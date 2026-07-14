import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

export const metadata: Metadata = {
  title: "Gatherly Help Center",
  description:
    "Get help with Gatherly — creating events, inviting guests, messaging, and more.",
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>
      {/* Page Content */}
      {children}
    </div>
  );
}
