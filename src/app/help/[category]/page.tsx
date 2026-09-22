import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, helpCategories } from "@/lib/help-data";
import HelpSidebarWrapper from "@/components/help/HelpSidebarWrapper";
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
    title: `${category.title} — JollyWitMe Help Center`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const allArticles = category.sections.flatMap((s) => s.articles);

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)] w-full max-w-7xl mx-auto">
      {/* Left Sidebar (Desktop) */}
      <HelpSidebarWrapper activeCategorySlug={category.slug} />

      {/* Main content */}
      <main className="flex-1 w-full pb-20 min-w-0">
        {/* Mobile / Tablet back navigation */}
        <div className="lg:hidden p-4 border-b border-white/10 bg-white/[0.02]">
          <Link href="/help" className="inline-flex items-center gap-1.5 text-xs text-green-400 font-bold hover:underline">
            ← Back to Help Center
          </Link>
        </div>

        {/* Category Hero */}
        <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-12 border-b border-white/10 relative overflow-hidden">
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
        <div className="px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
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
