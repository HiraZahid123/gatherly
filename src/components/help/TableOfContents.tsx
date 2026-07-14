"use client";

import { useEffect, useState } from "react";
import type { ArticleSection } from "@/lib/help-data";

interface TableOfContentsProps {
  sections: ArticleSection[];
}

export default function TableOfContents({ sections }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = sections.map((s) => document.getElementById(s.id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length <= 1) return null;

  return (
    <aside
      style={{
        width: "200px",
        minWidth: "200px",
        padding: "28px 0 28px 24px",
        position: "sticky",
        top: "60px",
        height: "calc(100vh - 60px)",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)",
          marginBottom: "14px",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
        }}
      >
        On This Page
      </p>
      <nav>
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              style={{
                display: "block",
                fontSize: "13px",
                color: isActive ? "#a78bfa" : "rgba(255,255,255,0.4)",
                textDecoration: "none",
                padding: "5px 0",
                borderLeft: isActive
                  ? "2px solid #a78bfa"
                  : "2px solid rgba(255,255,255,0.08)",
                paddingLeft: "12px",
                lineHeight: 1.5,
                transition: "all 0.2s",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)";
                }
              }}
            >
              {section.heading}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
