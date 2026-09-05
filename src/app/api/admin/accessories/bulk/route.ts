import { NextResponse } from "next/server";
import db from "@/db";
import { accessoires, consoleType } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";

const ACTIONS = [
  "show",
  "hide",
  "set-consoles",
  "add-consoles",
  "remove-consoles",
] as const;
type BulkAction = (typeof ACTIONS)[number];

/** Garde-fou : au-delà, c'est un import, pas une action de liste. */
const MAX_IDS = 200;

type Failure = { id: number; error: string };

function isConsoleAction(action: BulkAction): boolean {
  return action !== "show" && action !== "hide";
}

/** Nettoie un tableau d'ids venu du client : entiers positifs, sans doublon. */
function parseIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((value) => Number(value))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

/**
 * Actions groupées sur les accessoires : visibilité et plateformes compatibles.
 *
 * `set` remplace la liste de plateformes, `add` et `remove` la modifient sans
 * toucher au reste — c'est ce qui permet d'ajouter une plateforme à quarante
 * accessoires d'un coup sans écraser ce qui était déjà renseigné.
 *
 * Répond 200 même en cas d'échec partiel, comme les actions groupées sur les
 * utilisateurs : l'appelant lit `succeeded` et `failed` pour savoir ce qui est
 * réellement passé.
 */
export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Corps de requête JSON invalide." },
        { status: 400 },
      );
    }

    const action = body.action as BulkAction;
    if (!ACTIONS.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action inconnue." },
        { status: 400 },
      );
    }

    const ids = parseIds(body.ids);
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun accessoire valide." },
        { status: 400 },
      );
    }
    if (ids.length > MAX_IDS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_IDS} accessoires par appel.` },
        { status: 400 },
      );
    }

    let consoleIds: number[] = [];
    if (isConsoleAction(action)) {
      consoleIds = parseIds(body.consoles);
      // `set` avec une liste vide est légitime : c'est « retirer toutes les
      // plateformes ». `add` et `remove` sans cible ne veulent rien dire.
      if (consoleIds.length === 0 && action !== "set-consoles") {
        return NextResponse.json(
          { success: false, error: "Aucune plateforme fournie." },
          { status: 400 },
        );
      }

      // On ne vérifie l'existence que pour ce qui est écrit : retirer un id
      // orphelin laissé par une plateforme supprimée doit rester possible.
      if (action !== "remove-consoles" && consoleIds.length > 0) {
        const found = await db
          .select({ id: consoleType.id })
          .from(consoleType)
          .where(inArray(consoleType.id, consoleIds));
        if (found.length !== consoleIds.length) {
          return NextResponse.json(
            { success: false, error: "Plateforme inconnue dans la liste." },
            { status: 400 },
          );
        }
      }
    }

    const existing = await db
      .select({ id: accessoires.id, consoles: accessoires.consoles })
      .from(accessoires)
      .where(inArray(accessoires.id, ids));

    const existingById = new Map(existing.map((row) => [row.id, row]));
    const failed: Failure[] = ids
      .filter((id) => !existingById.has(id))
      .map((id) => ({ id, error: "Accessoire introuvable." }));

    const targetIds = ids.filter((id) => existingById.has(id));
    if (targetIds.length === 0) {
      return NextResponse.json({ success: false, succeeded: [], failed });
    }

    const succeeded: number[] = [];

    if (!isConsoleAction(action)) {
      // Même valeur pour toute la sélection : un seul UPDATE suffit.
      await db
        .update(accessoires)
        .set({ hidden: action === "hide" ? 1 : 0, lastUpdatedAt: sql`NOW()` })
        .where(inArray(accessoires.id, targetIds));
      succeeded.push(...targetIds);
    } else {
      const mode =
        action === "set-consoles"
          ? "set"
          : action === "add-consoles"
            ? "add"
            : "remove";

      // Chaque ligne part d'une liste différente : le calcul se fait par
      // accessoire, et un échec isolé n'emporte pas les autres.
      for (const id of targetIds) {
        try {
          const current = existingById.get(id)!.consoles;
          const currentIds = Array.isArray(current) ? (current as number[]) : [];
          let next: number[];
          if (mode === "set") {
            next = consoleIds;
          } else if (mode === "add") {
            next = [...new Set([...currentIds, ...consoleIds])];
          } else {
            const removed = new Set(consoleIds);
            next = currentIds.filter((value) => !removed.has(value));
          }

          await db
            .update(accessoires)
            .set({ consoles: next, lastUpdatedAt: sql`NOW()` })
            .where(eq(accessoires.id, id));
          succeeded.push(id);
        } catch (err) {
          console.error(
            `Action groupée "${action}" en échec sur l'accessoire ${id}:`,
            err,
          );
          failed.push({
            id,
            error:
              err instanceof Error ? err.message : "Erreur interne du serveur.",
          });
        }
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      succeeded,
      failed,
    });
  } catch (error) {
    console.error("ERREUR ACTION GROUPÉE ACCESSOIRES:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur." },
      { status: 500 },
    );
  }
});
