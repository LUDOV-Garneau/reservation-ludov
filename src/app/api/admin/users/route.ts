import { NextResponse } from "next/server";
import db from "@/db";
import { users } from "@/db/schema";
import { or, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = (searchParams.get("search") || "").trim();
    const offset = (page - 1) * limit;

    // Recherche côté serveur (nom, courriel) : couvre toutes les pages.
    const searchPattern = `%${search}%`;
    const searchClause = search
      ? or(
          sql`LOWER(CONCAT(${users.firstname}, ' ', ${users.lastname})) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${users.email}) LIKE LOWER(${searchPattern})`,
        )
      : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          createdAt: users.createdAt,
          firstname: users.firstname,
          lastname: users.lastname,
          isAdmin: users.isAdmin,
        })
        .from(users)
        .where(searchClause)
        .orderBy(users.id)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(users)
        .where(searchClause),
    ]);

    return NextResponse.json({ rows, total });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
});
