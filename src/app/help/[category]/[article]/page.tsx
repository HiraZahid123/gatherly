import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, helpCategories } from "@/lib/help-data";
import type { ArticleSection } from "@/lib/help-data";
import HelpSidebarWrapper from "@/components/help/HelpSidebarWrapper";
import TableOfContentsWrapper from "@/components/help/TableOfContentsWrapper";

interface Props {
  params: Promise<{ category: string; article: string }>;
}

export async function generateStaticParams() {
  const paths: { category: string; article: string }[] = [];
  for (const cat of helpCategories) {
    for (const section of cat.sections) {
      for (const article of section.articles) {
        paths.push({ category: cat.slug, article: article.slug });
      }
    }
  }
  return paths;
}

export async function generateMetadata({ params }: Props) {
  const { category, article: articleSlug } = await params;
  const result = getArticleBySlug(category, articleSlug);
  if (!result) return {};
  return {
    title: `${result.article.title} — JollyWitMe Help Center`,
    description: result.article.description,
  };
}

// ─── Render a single body string with **bold**, `code`, \n paragraphs ────────

function RenderBody({ text }: { text: string }) {
  // Split on \n\n for paragraph breaks
  const paragraphs = text.split("\n\n");
  return (
    <>
      {paragraphs.map((para, i) => {
        // Parse **bold** and `code` inline
        const parts = para.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return (
          <p
            key={i}
            style={{
              fontSize: "15px",
              lineHeight: "1.75",
              color: "rgba(255,255,255,0.78)",
              margin: "0 0 16px",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={j} style={{ color: "#fff", fontWeight: 600 }}>
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={j}
                    style={{
                      background: "rgba(74,222,128,0.15)",
                      border: "1px solid rgba(74,222,128,0.2)",
                      borderRadius: "4px",
                      padding: "1px 6px",
                      fontSize: "13px",
                      color: "#c4b5fd",
                      fontFamily: "monospace",
                    }}
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
}

// ─── Callout box ─────────────────────────────────────────────────────────────

function Callout({ type, text }: { type: "tip" | "note" | "warning"; text: string }) {
  const config = {
    tip: { emoji: "💡", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", color: "#34d399" },
    note: { emoji: "📌", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.25)", color: "#34d399" },
    warning: { emoji: "⚠️", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", color: "#fbbf24" },
  }[type];

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderLeft: `3px solid ${config.color}`,
        borderRadius: "10px",
        padding: "14px 18px",
        margin: "20px 0",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{config.emoji}</span>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "rgba(255,255,255,0.75)",
          lineHeight: "1.6",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ─── Article section renderer ─────────────────────────────────────────────────

function ArticleSectionBlock({ section }: { section: ArticleSection }) {
  return (
    <div style={{ marginBottom: "48px" }}>
      <h2
        id={section.id}
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#fff",
          margin: "0 0 16px",
          letterSpacing: "-0.3px",
          scrollMarginTop: "80px",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          paddingTop: "8px",
        }}
      >
        {section.heading}
      </h2>

      <RenderBody text={section.body} />

      {/* Numbered steps */}
      {section.steps && section.steps.length > 0 && (
        <ol style={{ margin: "20px 0", padding: 0, listStyle: "none" }}>
          {section.steps.map((step, i) => {
            const parts = step.split(/(\*\*[^*]+\*\*)/g);
            return (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "rgba(74,222,128,0.2)",
                    border: "1px solid rgba(74,222,128,0.4)",
                    color: "#4ade80",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.75)",
                    lineHeight: "1.6",
                    fontFamily: "var(--font-inter, Inter, sans-serif)",
                  }}
                >
                  {parts.map((p, j) =>
                    p.startsWith("**") && p.endsWith("**") ? (
                      <strong key={j} style={{ color: "#fff", fontWeight: 600 }}>
                        {p.slice(2, -2)}
                      </strong>
                    ) : (
                      <span key={j}>{p}</span>
                    )
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Callout */}
      {section.callout && (
        <Callout type={section.callout.type} text={section.callout.text} />
      )}

      {/* Screenshot / image */}
      {section.image && (
        <div
          style={{
            margin: "24px 0",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <Image
            src={section.image}
            alt={section.imageAlt || ""}
            width={800}
            height={450}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          />
          {section.imageAlt && (
            <p
              style={{
                margin: 0,
                padding: "10px 16px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                fontStyle: "italic",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {section.imageAlt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: Props) {
  const { category: categorySlug, article: articleSlug } = await params;
  const result = getArticleBySlug(categorySlug, articleSlug);
  if (!result) notFound();

  const { category, article } = result;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)] w-full max-w-7xl mx-auto">
      {/* Left Sidebar (Desktop) */}
      <HelpSidebarWrapper
          activeCategorySlug={category.slug}
          activeArticleSlug={article.slug}
      />

      {/* Main content */}
      <main className="flex-1 w-full max-w-3xl px-4 sm:px-8 lg:px-12 py-6 sm:py-10 pb-20 min-w-0 mx-auto lg:mx-0">
        {/* Mobile / Tablet back navigation */}
        <div className="lg:hidden mb-6 p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
          <Link
            href={`/help/${category.slug}`}
            className="flex items-center gap-1.5 text-green-400 font-bold hover:underline"
          >
            <span>← {category.title}</span>
          </Link>
          <Link href="/help" className="text-white/40 hover:text-white transition-colors">
            All Topics
          </Link>
        </div>

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6 text-xs sm:text-sm text-white/40 font-sans">
          <Link
            href="/help"
            className="help-breadcrumb-link text-white/40 hover:text-white transition-colors"
          >
            Help Center
          </Link>
          <span>›</span>
          <Link
            href={`/help/${category.slug}`}
            className="help-breadcrumb-link text-white/40 hover:text-white transition-colors"
          >
            {category.title}
          </Link>
          <span>›</span>
          <span className="text-white/70 truncate max-w-[200px] sm:max-w-none">{article.title}</span>
        </nav>

        {/* Article title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight leading-tight font-sans">
          {article.title}
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/50 mb-8 leading-relaxed font-sans">
          {article.description}
        </p>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            marginBottom: "40px",
          }}
        />

        {/* Article sections */}
        {article.sections.map((section) => (
          <ArticleSectionBlock key={section.id} section={section} />
        ))}

        {/* Footer nav */}
        <div
          style={{
            marginTop: "60px",
            paddingTop: "28px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href={`/help/${category.slug}`}
            style={{
              fontSize: "13px",
              color: "#4ade80",
              textDecoration: "none",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Back to {category.title}
          </Link>
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.2)",
              margin: 0,
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            Still stuck?{" "}
            <Link href="/contact" style={{ color: "#4ade80", textDecoration: "none" }}>
              Contact us
            </Link>
          </p>
        </div>
      </main>

      {/* Right: Table of Contents */}
      <TableOfContentsWrapper sections={article.sections} />
    </div>
  );
}
