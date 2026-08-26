import { NextResponse } from "next/server";

// Sonde de vivacité utilisée par le HEALTHCHECK du Dockerfile et par Coolify
// pour décider quand basculer le trafic sur le nouveau conteneur.
// Volontairement sans accès à la base : une coupure MySQL passagère ne doit
// pas faire redémarrer le conteneur ni bloquer un déploiement.
export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            uptime: Math.round(process.uptime()),
        },
        { status: 200 }
    );
}
