import { NextRequest, NextResponse } from "next/server";

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || "dc6zaTOxFJmzC";
const BASE = "https://api.giphy.com/v1/gifs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type") || "GIF"; // GIF | STICKER

    const endpoint = type === "STICKER" ? "https://api.giphy.com/v1/stickers" : BASE;
    const path = q ? `/search` : `/trending`;
    const params = new URLSearchParams({
        api_key: GIPHY_API_KEY,
        limit: "24",
        rating: "g",
        ...(q ? { q } : {}),
    });

    try {
        const res = await fetch(`${endpoint}${path}?${params}`);
        const data = await res.json();

        const results = (data.data || []).map((gif: any) => ({
            id: gif.id,
            url: gif.images?.fixed_height?.url || gif.images?.original?.url,
            preview: gif.images?.fixed_height_small?.url || gif.images?.fixed_height?.url,
            title: gif.title,
        })).filter((g: any) => g.url);

        return NextResponse.json({ results });
    } catch {
        return NextResponse.json({ results: [] });
    }
}
