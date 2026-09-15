import { getMatches } from "@/src/lib/tournament-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(
      { matches: await getMatches() },
      {
        headers: {
          "Cache-Control": "public, max-age=0, must-revalidate",
          "Vercel-CDN-Cache-Control":
            "public, s-maxage=2, stale-while-revalidate=8",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "No se pudieron leer los partidos." },
      { status: 500 },
    );
  }
}
