import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { parse } from "csv-parse/sync";
import { verifyToken } from "@/lib/jwt";

const EXPECTED_COLUMNS = [
  "Username",
  "Date Created",
  "Last Login",
  "First Name",
  "Last Name",
];

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
    if (!token) {
        return new Response(
            JSON.stringify({ success: false, message: "Unauthorized" }),
            { status: 401 }
        );
    }

    const user = verifyToken(token);
    if (!user?.isAdmin) {
        return new Response(
            JSON.stringify({ success: false, message: "Forbidden" }),
            { status: 403 }
        );
    }

    if (!user?.id) {
        return new Response(
            JSON.stringify({ success: false, message: "Unauthorized" }),
            { status: 401 }
        );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Fichier CSV manquant." },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Le fichier CSV est vide.",
        },
        { status: 400 }
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
        {
          success: false,
          error: "Impossible de lire le fichier CSV. Vérifiez le format.",
        },
        { status: 400 }
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
    const missingColumns = EXPECTED_COLUMNS.filter(
      (c) => !csvColumns.includes(c)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Colonnes manquantes dans le CSV: ${missingColumns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validRecords = records.filter((r) => EMAIL_REGEX.test(r.Username));
    const invalidRecords = records.filter((r) => !EMAIL_REGEX.test(r.Username));

    if (validRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun utilisateur valide à insérer.",
        inserted: 0,
        skipped: invalidRecords.length,
      });
    }

    const now = new Date();

    const users = validRecords.map((r) => {
      const dateCreatedRaw = r["Date Created"];
      const parsedDate = new Date(dateCreatedRaw);
      const dateCreated =
        isNaN(parsedDate.getTime()) || !dateCreatedRaw
          ? now
          : parsedDate;

      return {
        username: r.Username.trim(),
        firstName: r["First Name"]?.toString().trim() ?? "",
        lastName: r["Last Name"]?.toString().trim() ?? "",
        dateCreated,
        password: null as string | null,
        isAdmin: 0,
        lastUpdatedAt: now,
      };
    });

    const conn = await pool.getConnection();

    try {
      const emails = users.map((u) => u.username);

      const [existingRows] = await conn.query(
        `SELECT email FROM users WHERE email IN (?)`,
        [emails]
      );

      const existingEmails = new Set(
        (existingRows as { email: string }[]).map((r) => r.email)
      );

      const newUsers = users.filter((u) => !existingEmails.has(u.username));

      if (newUsers.length === 0) {
        return NextResponse.json({
          success: true,
          message: "Aucun nouvel utilisateur à insérer.",
          inserted: 0,
          skipped: invalidRecords.length + users.length,
        });
      }

      await conn.beginTransaction();

      const sql = `
        INSERT INTO users 
          (firstname, lastname, email, password, isAdmin, lastUpdatedAt, createdAt)
        VALUES ?
      `;

      const values = newUsers.map((u) => [
        u.firstName,
        u.lastName,
        u.username,
        u.password,
        u.isAdmin,
        u.lastUpdatedAt,
        u.dateCreated,
      ]);

      await conn.query(sql, [values]);
      await conn.commit();

      const skipped =
        invalidRecords.length + (users.length - newUsers.length);

      return NextResponse.json({
        success: true,
        message: "Utilisateurs insérés avec succès.",
        inserted: newUsers.length,
        skipped,
      });
    } catch (err) {
      console.error("Error inserting users from CSV:", err);
      try {
        await pool.query("ROLLBACK");
      } catch {
      }

      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de l'insertion des utilisateurs.",
        },
        { status: 500 }
      );
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error adding users from CSV:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
