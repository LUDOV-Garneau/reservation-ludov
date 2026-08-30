import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import db from "@/db";
import { users } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { withAdmin } from "@/lib/withAuth";
import {
  CSV_MAX_BYTES,
  isDuplicateEmailError,
  normalizeEmail,
  toMysqlDatetime,
  validateNewUser,
} from "@/lib/userValidation";

const EXPECTED_COLUMNS = [
  "Username",
  "Date Created",
  "Last Login",
  "First Name",
  "Last Name",
];

type CsvUserRecord = {
  Username: string;
  "First Name": string;
  "Last Name": string;
  "Date Created": string;
  "Last Login"?: string;
  [key: string]: unknown;
};

function parseDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const POST = withAdmin(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "Fichier CSV manquant." },
        { status: 400 },
      );
    }

    // La limite était annoncée dans l'interface sans être appliquée nulle part :
    // `file.text()` chargeait en mémoire tout ce qu'on lui envoyait.
    if (file.size > CSV_MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Le fichier dépasse la taille maximale de ${Math.round(
            CSV_MAX_BYTES / (1024 * 1024),
          )} MB.`,
        },
        { status: 413 },
      );
    }

    const csvText = await file.text();
    if (!csvText.trim()) {
      return NextResponse.json(
        { success: false, error: "Le fichier CSV est vide." },
        { status: 400 },
      );
    }

    let records: CsvUserRecord[] = [];
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvUserRecord[];
    } catch (err) {
      console.error("Error parsing CSV:", err);
      return NextResponse.json(
        { success: false, error: "Impossible de lire le fichier CSV. Vérifiez le format." },
        { status: 400 },
      );
    }

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun enregistrement trouvé dans le CSV.",
        inserted: 0,
        skipped: 0,
      });
    }

    const csvColumns = Object.keys(records[0] as object);
    const missingColumns = EXPECTED_COLUMNS.filter((c) => !csvColumns.includes(c));
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { success: false, error: `Colonnes manquantes dans le CSV: ${missingColumns.join(", ")}` },
        { status: 400 },
      );
    }

    const now = new Date();
    const nowStr = toMysqlDatetime(now);

    // Une ligne est retenue si elle passe les mêmes règles que l'ajout manuel :
    // auparavant seul le format du courriel était vérifié, et un « First Name »
    // absent entrait en base comme chaîne vide.
    const seen = new Set<string>();
    const candidates: {
      firstname: string;
      lastname: string;
      email: string;
      createdAt: string;
      lastLogin: string | null;
    }[] = [];
    let skipped = 0;

    for (const record of records) {
      const firstname = String(record["First Name"] ?? "").trim();
      const lastname = String(record["Last Name"] ?? "").trim();
      const email = normalizeEmail(String(record.Username ?? ""));

      if (Object.keys(validateNewUser({ firstname, lastname, email })).length > 0) {
        skipped++;
        continue;
      }

      // Doublon à l'intérieur du fichier : la vérification en base ne le voit
      // pas, et depuis la contrainte unique il ferait échouer tout l'insert.
      if (seen.has(email)) {
        skipped++;
        continue;
      }
      seen.add(email);

      const created = parseDate(record["Date Created"]) ?? now;
      const lastLogin = parseDate(record["Last Login"]);

      candidates.push({
        firstname,
        lastname,
        email,
        createdAt: toMysqlDatetime(created),
        // La colonne était exigée dans le CSV sans jamais être lue ; la liste
        // affiche maintenant « Dernière connexion », autant la remplir.
        lastLogin: lastLogin ? toMysqlDatetime(lastLogin) : null,
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun utilisateur valide à insérer.",
        inserted: 0,
        skipped,
      });
    }

    const existingRows = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, candidates.map((c) => c.email)));
    const existingEmails = new Set(existingRows.map((r) => r.email));

    const newUsers = candidates.filter((c) => !existingEmails.has(c.email));
    skipped += candidates.length - newUsers.length;

    if (newUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun nouvel utilisateur à insérer.",
        inserted: 0,
        skipped,
      });
    }

    try {
      await db.transaction(async (tx) => {
        await tx.insert(users).values(
          newUsers.map((u) => ({
            firstname: u.firstname,
            lastname: u.lastname,
            email: u.email,
            password: null,
            isAdmin: 0,
            lastUpdatedAt: nowStr,
            createdAt: u.createdAt,
            lastLogin: u.lastLogin,
          })),
        );
      });
    } catch (err) {
      if (isDuplicateEmailError(err)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Un des courriels du fichier vient d'être créé par ailleurs. Réessayez l'import.",
          },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateurs insérés avec succès.",
      inserted: newUsers.length,
      skipped,
    });
  } catch (error) {
    console.error("Error adding users from CSV:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
});
