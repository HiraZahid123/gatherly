import Link from "next/link";

interface ArticleCardProps {
  href: string;
  title: string;
  description: string;
}

export default function ArticleCard({ href, title, description }: ArticleCardProps) {
  return (
    <>
      <style>{`
        .article-card-link { text-decoration: none; display: block; height: 100%; }
        .article-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          transform: translateY(0);
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .article-card:hover {
          background: rgba(167,139,250,0.08);
          border-color: rgba(167,139,250,0.35);
          transform: translateY(-2px);
        }
        .article-card-arrow {
          color: rgba(167,139,250,0.6);
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 1px;
          transition: color 0.2s;
        }
        .article-card:hover .article-card-arrow {
          color: #a78bfa;
        }
      `}</style>
      <Link href={href} className="article-card-link">
        <div className="article-card">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <h2
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#fff",
                margin: 0,
                lineHeight: 1.4,
                fontFamily: "var(--font-inter, Inter, sans-serif)",
              }}
            >
              {title}
            </h2>
            <span className="article-card-arrow">→</span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              margin: 0,
              lineHeight: 1.5,
              fontFamily: "var(--font-inter, Inter, sans-serif)",
            }}
          >
            {description}
          </p>
        </div>
      </Link>
    </>
  );
}
