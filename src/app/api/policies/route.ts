import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const conn = await pool.getConnection();
        try {
            const [policies] = await conn.query(
                `SELECT * FROM policies`
            );

            conn.release();

            if (Array.isArray(policies) && policies.length > 0) {
                return NextResponse.json({ policies: policies[0] });
            } else {
                return NextResponse.json({ policies: null });
            }
        } catch (error) {
            conn.release();
            console.error("Error querying policies:", error);
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error handling policies POST request:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = verifyToken(token);
  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { policies } = body;

    if (!policies || policies.trim() === "") {
      return NextResponse.json({ error: "Le champ politiques est requis." }, { status: 400 });
    }

    const now = new Date();

    const conn = await pool.getConnection();

    try {
      const [existingPolicies] = await conn.query(
        `SELECT policies FROM policies LIMIT 1`
      );

        if (Array.isArray(existingPolicies) && existingPolicies.length > 0) {
            await conn.query(
                
                `
                UPDATE policies
                SET policies = ?, lastUpdatedAt = ?
                `,
                [policies, now]
            );
        } else {
            await conn.query(
                `
                INSERT INTO policies (policies, lastUpdatedAt)
                VALUES (?, ?)
                `,
                [policies, now]
            );
        }
        conn.release();
        return NextResponse.json({ success: true, message: "Politiques sauvegardées avec succès." });
    } catch (error) {
        conn.release();
        console.error("Error saving policies:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error handling policies POST request:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}