import { NextResponse } from "next/server";
import db from "@/db";
import { accessoires, consoleType } from "@/db/schema";
import { withAdmin } from "@/lib/withAuth";

/**
 * Liste complète des accessoires (admin), avec le nom des plateformes
 * associées (accessoires.consoles = tableau JSON d'ids de console_type).
 */
export const GET = withAdmin(async () => {
  try {
    const [accessoryRows, consoleTypes] = await Promise.all([
      db
        .select({
          id: accessoires.id,
          name: accessoires.name,
          kohaId: accessoires.kohaId,
          consoles: accessoires.consoles,
          hidden: accessoires.hidden,
        })
        .from(accessoires)
        .orderBy(accessoires.name),
      db.select({ id: consoleType.id, name: consoleType.name }).from(consoleType),
    ]);

    const consoleNameById = new Map(consoleTypes.map((c) => [c.id, c.name]));

    const data = accessoryRows.map((row) => {
      const consoleIds = Array.isArray(row.consoles)
        ? (row.consoles as number[])
        : [];
      return {
        id: row.id,
        name: row.name,
        kohaId: row.kohaId,
        hidden: row.hidden === 1,
        consoles: consoleIds.map((id) => ({
          id,
          name: consoleNameById.get(id) ?? `#${id}`,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      accessories: data,
      consoleTypes,
    });
  } catch (error) {
    console.error("Erreur liste accessoires:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement des accessoires." },
      { status: 500 },
    );
  }
});
