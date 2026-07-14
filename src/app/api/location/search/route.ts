import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
        return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                q
            )}&countrycodes=ng&addressdetails=1&limit=5`,
            {
                headers: {
                    "User-Agent": "Gatherly Event App (contact@gatherly.com)",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Location API Error]", errorText);
            return NextResponse.json({ error: "Nominatim error" }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[Location API Exception]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
