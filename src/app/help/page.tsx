"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { helpCategories, getAllArticles } from "@/lib/help-data";
import type { HelpCategory } from "@/lib/help-data";

// ─── Live search ────────────────────────────────────────────────────────────

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ category: HelpCategory; slug: string; title: string; description: string }>
  >([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const all = getAllArticles();
    const q = query.toLowerCase();
    const filtered = all
      .filter(
        ({ article }) =>
          article.title.toLowerCase().includes(q) ||
          article.description.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(({ category, article }) => ({
        category,
        slug: article.slug,
        title: article.title,
        description: article.description,
      }));
    setResults(filtered);
    setOpen(filtered.length > 0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: "600px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "14px",
          padding: "0 20px",
          gap: "12px",
          backdropFilter: "blur(10px)",
        }}
      >
        <span style={{ fontSize: "18px", opacity: 0.5 }}>🔍</span>
        <input
          type="text"
          placeholder="Search for anything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontSize: "16px",
            padding: "18px 0",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#1a1a2e",
            border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: "14px",
            overflow: "hidden",
            zIndex: 100,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {results.map((r) => (
            <Link
              key={`${r.category.slug}-${r.slug}`}
              href={`/help/${r.category.slug}/${r.slug}`}
              onClick={() => { setQuery(""); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(74,222,128,0.1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = "transparent")
              }
            >
              <span style={{ fontSize: "20px" }}>{r.category.emoji}</span>
              <div>
                <div style={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}>
                  {r.title}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                >
                  {r.category.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Card ───────────────────────────────────────────────────────────

function CategoryCard({ category }: { category: HelpCategory }) {
  const [hovered, setHovered] = useState(false);
  // pick first 3 articles across all sections
  const previewArticles = category.sections
    .flatMap((s) => s.articles)
    .slice(0, 3);

  return (
    <Link
      href={`/help/${category.slug}`}
      style={{ textDecoration: "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          background: hovered
            ? "rgba(74,222,128,0.08)"
            : "rgba(255,255,255,0.04)",
          border: hovered
            ? "1px solid rgba(74,222,128,0.4)"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "28px",
          cursor: "pointer",
          transition: "all 0.25s ease",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 20px 40px rgba(0,0,0,0.3)"
            : "0 4px 16px rgba(0,0,0,0.15)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Emoji + Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "32px" }}>{category.emoji}</span>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.3px",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            {category.title}
          </h2>
        </div>

        {/* Description */}
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "14px",
            margin: 0,
            lineHeight: "1.5",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
          }}
        >
          {category.description}
        </p>

        {/* Preview articles */}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, marginTop: "auto" }}>
          {previewArticles.map((article) => (
            <li
              key={article.slug}
              style={{
                fontSize: "13px",
                color: hovered ? "#4ade80" : "rgba(74,222,128,0.7)",
                padding: "4px 0",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ opacity: 0.5, fontSize: "10px" }}>→</span>
              {article.title}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HelpHomePage() {
  return (
    <main>
      {/* ── Hero Section ── */}
      <section
        style={{
          position: "relative",
          padding: "80px 24px 100px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(22,163,74,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Floating confetti dots */}
        {[
          { top: "10%", left: "8%", color: "#facc15", size: "8px", delay: "0s" },
          { top: "20%", left: "92%", color: "#4ade80", size: "6px", delay: "0.5s" },
          { top: "70%", left: "5%", color: "#34d399", size: "5px", delay: "1s" },
          { top: "75%", left: "95%", color: "#fbbf24", size: "7px", delay: "1.5s" },
          { top: "40%", left: "3%", color: "#34d399", size: "6px", delay: "0.8s" },
          { top: "55%", left: "97%", color: "#fbbf24", size: "5px", delay: "1.3s" },
        ].map((dot, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              borderRadius: "50%",
              background: dot.color,
              opacity: 0.6,
              animation: `float 4s ease-in-out infinite ${dot.delay}`,
            }}
          />
        ))}

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Tagline badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: "20px",
              padding: "6px 16px",
              marginBottom: "28px",
              fontSize: "13px",
              color: "#4ade80",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              fontWeight: 500,
            }}
          >
            <span>✨</span> We&apos;re here to help
          </div>

          {/* Main heading */}
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 68px)",
              fontWeight: 800,
              margin: "0 0 20px",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              color: "#fff",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            Gatherly Help Center
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.55)",
              margin: "0 auto 48px",
              maxWidth: "480px",
              lineHeight: 1.6,
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            Find answers, guides, and everything you need to throw an amazing event.
          </p>

          {/* Search bar */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px 100px",
        }}
      >
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: "24px",
            fontFamily: "var(--font-inter, Inter, sans-serif)",
          }}
        >
          Browse by topic
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {helpCategories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "32px 24px",
          textAlign: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: "13px",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
        }}
      >
        Still stuck?{" "}
        <Link
          href="/contact"
          style={{ color: "#4ade80", textDecoration: "none" }}
        >
          Contact us
        </Link>{" "}
        and we&apos;ll get back to you.
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </main>
  );
}
