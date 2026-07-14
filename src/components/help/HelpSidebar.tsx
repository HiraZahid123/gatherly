"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { helpCategories } from "@/lib/help-data";

interface HelpSidebarProps {
  activeCategorySlug?: string;
  activeArticleSlug?: string;
}

export default function HelpSidebar({
  activeCategorySlug,
  activeArticleSlug,
}: HelpSidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(activeCategorySlug ? [activeCategorySlug] : [])
  );

  function toggleCategory(slug: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <aside
      style={{
        width: "260px",
        minWidth: "260px",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 0",
        position: "sticky",
        top: "60px",
        height: "calc(100vh - 60px)",
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      {/* Search (static visual — real search is on homepage) */}
      <div style={{ padding: "0 16px 24px" }}>
        <Link
          href="/help"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "10px 14px",
            textDecoration: "none",
            color: "rgba(255,255,255,0.4)",
            fontSize: "13px",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
          }}
        >
          <span>🔍</span>
          <span>Search…</span>
        </Link>
      </div>

      {/* Category tree */}
      {helpCategories.map((category) => {
        const isExpanded = expandedCategories.has(category.slug);
        const isActiveCategory = category.slug === activeCategorySlug;

        return (
          <div key={category.slug} style={{ marginBottom: "4px" }}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.slug)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: isActiveCategory ? "#fff" : "rgba(255,255,255,0.55)",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                transition: "color 0.2s",
              }}
            >
              <span style={{ fontSize: "14px" }}>{category.emoji}</span>
              <span style={{ flex: 1 }}>{category.title}</span>
              <span
                style={{
                  fontSize: "10px",
                  opacity: 0.5,
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                ▶
              </span>
            </button>

            {/* Articles under this category */}
            {isExpanded && (
              <div style={{ marginBottom: "8px" }}>
                {category.sections.flatMap((section) =>
                  section.articles.map((article) => {
                    const isActive = article.slug === activeArticleSlug;
                    return (
                      <Link
                        key={article.slug}
                        href={`/help/${category.slug}/${article.slug}`}
                        style={{
                          display: "block",
                          padding: "7px 16px 7px 40px",
                          fontSize: "13px",
                          color: isActive ? "#a78bfa" : "rgba(255,255,255,0.5)",
                          textDecoration: "none",
                          borderLeft: isActive
                            ? "2px solid #a78bfa"
                            : "2px solid transparent",
                          background: isActive
                            ? "rgba(167,139,250,0.06)"
                            : "transparent",
                          fontFamily: "var(--font-inter, Inter, sans-serif)",
                          fontWeight: isActive ? 500 : 400,
                          lineHeight: 1.5,
                          transition: "all 0.15s",
                          marginLeft: "14px",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
                          }
                        }}
                      >
                        {article.title}
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
