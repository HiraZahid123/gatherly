import { notFound } from "next/navigation";
import { getCategoryBySlug, helpCategories } from "@/lib/help-data";
import HelpSidebar from "@/components/help/HelpSidebar";
import ArticleCard from "@/components/help/ArticleCard";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return helpCategories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return {};
  return {
    title: `${category.title} — Gatherly Help Center`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const allArticles = category.sections.flatMap((s) => s.articles);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
      {/* Left Sidebar */}
      <HelpSidebar activeCategorySlug={category.slug} />

      {/* Main content */}
      <main style={{ flex: 1, padding: "0 0 80px", minWidth: 0 }}>
        {/* Category Hero */}
        <div
          style={{
            padding: "48px 48px 40px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              left: "-40px",
              width: "300px",
              height: "200px",
              background:
                "radial-gradient(ellipse at center, rgba(22,163,74,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                lineHeight: 1,
              }}
            >
              {category.emoji}
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: 800,
                color: "#fff",
                margin: "0 0 12px",
                letterSpacing: "-0.5px",
                fontFamily: "var(--font-inter, Inter, sans-serif)",
              }}
            >
              {category.title}
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.5)",
                margin: 0,
                fontFamily: "var(--font-inter, Inter, sans-serif)",
              }}
            >
              {category.description}
            </p>
          </div>
        </div>

        {/* Article Grid */}
        <div style={{ padding: "40px 48px" }}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "20px",
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            {allArticles.length} article{allArticles.length !== 1 ? "s" : ""} in this section
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {allArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                href={`/help/${category.slug}/${article.slug}`}
                title={article.title}
                description={article.description}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
