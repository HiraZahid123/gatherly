import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
        return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
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
