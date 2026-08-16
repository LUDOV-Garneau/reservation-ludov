import { NextResponse } from "next/server";
import db from "@/db";
import { withAdmin } from "@/lib/withAuth";

export const GET = withAdmin(async () => {
  try {
    const rows = await db.query.consoleType.findMany({
      columns: { id: true, name: true, picture: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    });
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du fetch consoleType :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
});
