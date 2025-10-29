import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
      try {
          const token  = sessionCookie?.value;
          if (token) user = verifyToken(token);
      } catch{
          return NextResponse.json(
              { success: false, message: "Invalid or expired token" },
              { status: 401 }
          );
      }
    if (!user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Dernier hold -> console_type_id directement
    const [holdRows] = await pool.query(
      `SELECT console_type_id
         FROM reservation_hold
        WHERE user_id = ?
        ORDER BY createdAt DESC
        LIMIT 1`,
      [userId]
    );
    const holds = holdRows as { console_type_id: number | null }[];
    const consoleTypeId = Number(holds?.[0]?.console_type_id);

    if (!Number.isFinite(consoleTypeId)) {
      return NextResponse.json(
        { success: false, data: [], message: "No recent reservation hold found for user" },
        { status: 404 }
      );
    }

    // Accessoires pour ce console_type_id
    const [rows] = await pool.query(
      `SELECT id, name
         FROM accessoires
        WHERE consoles IS NOT NULL
          AND JSON_VALID(consoles)
          AND JSON_CONTAINS(consoles, CAST(? AS JSON), '$')`,
      [String(consoleTypeId)] // passer l'ID en JSON
    );

    const accessories = (rows as { id: number; name: string }[]) || [];

    if (accessories.length === 0) {
      return NextResponse.json(
        { success: false, data: [], message: "No accessories found for the user's console" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: accessories });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { success: false, data: [], message: "Internal server error" },
      { status: 500 }
    );
  }
}
