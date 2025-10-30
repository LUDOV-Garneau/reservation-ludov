import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { parse } from "csv-parse/sync";

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
      [key: string]: unknown;
    };

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier téléversé." },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvUserRecord[];

    const csvColumns = Object.keys(records[0] as object);
    const missingColumns = EXPECTED_COLUMNS.filter(
      (c) => !csvColumns.includes(c)
    );
    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Colonnes manquantes: ${missingColumns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validRecords = records.filter((r) =>
      EMAIL_REGEX.test(r.Username)
    );
    const invalidRecords = records.filter(
      (r) => !EMAIL_REGEX.test(r.Username)
    );

    if (validRecords.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Aucun utilisateur valide à insérer.",
          inserted: 0,
          skipped: invalidRecords.length,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    

    const users = (validRecords as CsvUserRecord[]).map((r) => ({
      username: r["Username"],
      firstName: r["First Name"],
      lastName: r["Last Name"],
      dateCreated: new Date(r["Date Created"]),
      password: null,
      isAdmin: 0,
      lastUpdatedAt: now,
    }));

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
        conn.release();
        return NextResponse.json({
          success: false,
          message: "Aucun nouvel utilisateur à insérer (tous déjà existants).",
          inserted: 0,
          skipped: invalidRecords.length + (users.length - newUsers.length),
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

      return NextResponse.json({
        success: true,
        inserted: newUsers.length,
        skipped:
          invalidRecords.length + (users.length - newUsers.length),
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
