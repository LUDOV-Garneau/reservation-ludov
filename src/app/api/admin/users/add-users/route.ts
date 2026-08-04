import { NextResponse, NextRequest } from "next/server";
import { parse } from "csv-parse/sync";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { users } from "@/db/schema";
import { inArray } from "drizzle-orm";

const EXPECTED_COLUMNS = ["Username", "Date Created", "Last Login", "First Name", "Last Name"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CsvUserRecord = {
  Username: string;
  "First Name": string;
  "Last Name": string;
  "Date Created": string;
  "Last Login"?: string;
  [key: string]: unknown;
};

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user?.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "Fichier CSV manquant." }, { status: 400 });

    const csvText = await file.text();
    if (!csvText.trim()) return NextResponse.json({ success: false, error: "Le fichier CSV est vide." }, { status: 400 });

    let records: CsvUserRecord[] = [];
    try {
      records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true }) as CsvUserRecord[];
    } catch (err) {
      console.error("Error parsing CSV:", err);
      return NextResponse.json({ success: false, error: "Impossible de lire le fichier CSV. Vérifiez le format." }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun enregistrement trouvé dans le CSV.", inserted: 0, skipped: 0 });
    }

    const csvColumns = Object.keys(records[0] as object);
    const missingColumns = EXPECTED_COLUMNS.filter((c) => !csvColumns.includes(c));
    if (missingColumns.length > 0) {
      return NextResponse.json({ success: false, error: `Colonnes manquantes dans le CSV: ${missingColumns.join(", ")}` }, { status: 400 });
    }

    const validRecords = records.filter((r) => EMAIL_REGEX.test(r.Username));
    const invalidRecords = records.filter((r) => !EMAIL_REGEX.test(r.Username));

    if (validRecords.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun utilisateur valide à insérer.", inserted: 0, skipped: invalidRecords.length });
    }

    const now = new Date();
    const toInsert = validRecords.map((r) => {
      const parsedDate = new Date(r["Date Created"]);
      const dateCreated = isNaN(parsedDate.getTime()) || !r["Date Created"] ? now : parsedDate;
      return {
        username: r.Username.trim(),
        firstName: r["First Name"]?.toString().trim() ?? "",
        lastName: r["Last Name"]?.toString().trim() ?? "",
        dateCreated,
      };
    });

    const emails = toInsert.map((u) => u.username);
    const existingRows = await db.select({ email: users.email }).from(users).where(inArray(users.email, emails));
    const existingEmails = new Set(existingRows.map((r) => r.email));

    const newUsers = toInsert.filter((u) => !existingEmails.has(u.username));
    if (newUsers.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun nouvel utilisateur à insérer.", inserted: 0, skipped: invalidRecords.length + toInsert.length });
    }

    const fmt = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);

    await db.transaction(async (tx) => {
      await tx.insert(users).values(
        newUsers.map((u) => ({
          firstname: u.firstName,
          lastname: u.lastName,
          email: u.username,
          password: null,
          isAdmin: 0,
          lastUpdatedAt: fmt(now),
          createdAt: fmt(u.dateCreated),
        }))
      );
    });

    const skipped = invalidRecords.length + (toInsert.length - newUsers.length);
    return NextResponse.json({ success: true, message: "Utilisateurs insérés avec succès.", inserted: newUsers.length, skipped });
  } catch (error) {
    console.error("Error adding users from CSV:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
