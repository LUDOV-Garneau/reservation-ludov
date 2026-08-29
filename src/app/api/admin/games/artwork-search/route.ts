import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/withAuth";
import { searchArtwork } from "@/lib/gameArtwork";

/** En deçà, la recherche ramène tout et rien : on ne sollicite pas les API. */
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 12;

/**
 * Recherche de jaquettes dans les bases de jeux configurées (IGDB pour
 * l'instant). Les identifiants restent côté serveur ; le navigateur ne voit
 * que des titres et des URL d'images.
 *
 * Réponse : { success, results, failedSources, noSourceConfigured }.
 */
export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim();

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({
        success: true,
        results: [],
        failedSources: [],
        noSourceConfigured: false,
      });
    }

    const outcome = await searchArtwork(query, MAX_RESULTS);
    return NextResponse.json({ success: true, ...outcome });
  } catch (error) {
    console.error("Erreur recherche de jaquettes:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recherche." },
      { status: 500 },
    );
  }
});
