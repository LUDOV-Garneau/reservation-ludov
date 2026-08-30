import { NextResponse } from "next/server";
import db from "@/db";
import { users } from "@/db/schema";
import { and, asc, desc, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

/**
 * Colonnes triables. Le paramètre `sort` est résolu par cette table plutôt
 * qu'interpolé : aucune valeur venue de l'URL n'atteint le SQL.
 */
const SORT_COLUMNS = {
  name: sql`CONCAT(${users.lastname}, ' ', ${users.firstname})`,
  email: users.email,
  createdAt: users.createdAt,
  lastLogin: users.lastLogin,
  role: users.isAdmin,
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

const DEFAULT_SORT: SortKey = "name";
const MAX_LIMIT = 100;

function resolveSort(value: string | null): SortKey {
  // Une valeur inconnue retombe sur le défaut : un lien partagé avec un
  // paramètre périmé doit afficher la liste, pas une erreur.
  return value && value in SORT_COLUMNS ? (value as SortKey) : DEFAULT_SORT;
}

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10),
    );
    const search = (searchParams.get("search") || "").trim();
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const sort = resolveSort(searchParams.get("sort"));
    const order = searchParams.get("order") === "desc" ? desc : asc;
    const offset = (page - 1) * limit;

    const filters: SQL[] = [];

    // Recherche côté serveur (nom, courriel) : couvre toutes les pages.
    if (search) {
      const searchPattern = `%${search}%`;
      const searchClause = or(
        sql`LOWER(CONCAT(${users.firstname}, ' ', ${users.lastname})) LIKE LOWER(${searchPattern})`,
        sql`LOWER(${users.email}) LIKE LOWER(${searchPattern})`,
      );
      if (searchClause) filters.push(searchClause);
    }

    if (role === "admin") filters.push(sql`${users.isAdmin} = 1`);
    else if (role === "user") filters.push(sql`${users.isAdmin} = 0`);

    // `password IS NULL` = compte jamais configuré (cf. reset-password, qui
    // remet la colonne à NULL, et la stat `totalUserNotBoarded`).
    if (status === "pending") filters.push(isNull(users.password));
    else if (status === "active") filters.push(isNotNull(users.password));

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          createdAt: users.createdAt,
          lastLogin: users.lastLogin,
          firstname: users.firstname,
          lastname: users.lastname,
          isAdmin: users.isAdmin,
          // On expose le booléen d'activation, jamais le hash.
          hasPassword: sql<boolean>`${users.password} IS NOT NULL`,
        })
        .from(users)
        .where(where)
        .orderBy(order(SORT_COLUMNS[sort]))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)` })
        .from(users)
        .where(where),
    ]);

    return NextResponse.json({
      rows: rows.map((row) => ({ ...row, hasPassword: Boolean(row.hasPassword) })),
      total: Number(total ?? 0),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
});
