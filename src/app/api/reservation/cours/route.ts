import { NextResponse } from "next/server";
import db from "@/db";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async () => {
  try {
    return NextResponse.json(await db.query.cours.findMany(), { status: 200 });
  } catch (error) {
    console.error("[GET /api/cours] error:", error);
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "production"
            ? "Une erreur s'est produite."
            : String(error),
      },
      { status: 500 },
    );
  }
});
