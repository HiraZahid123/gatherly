"use client";

import Link from "next/link";
import { useState } from "react";

interface ArticleCardProps {
  href: string;
  title: string;
  description: string;
}

export default function ArticleCard({ href, title, description }: ArticleCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.04)",
          border: hovered
            ? "1px solid rgba(167,139,250,0.35)"
            : "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "24px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
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
          <span
            style={{
              color: hovered ? "#a78bfa" : "rgba(167,139,250,0.6)",
              fontSize: "18px",
              flexShrink: 0,
              marginTop: "1px",
              transition: "color 0.2s",
            }}
          >
            →
          </span>
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
  );
}
