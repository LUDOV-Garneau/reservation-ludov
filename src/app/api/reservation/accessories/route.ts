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
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
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

    // Récupère le dernier hold
    const [holdRows] = await pool.query(
      `SELECT console_type_id
         FROM reservation_hold
        WHERE user_id = ?
        ORDER BY createdAt DESC
        LIMIT 1`,
      [userId]
    );

    const holds = (holdRows as { console_type_id: number | null }[]) || [];
    const consoleTypeIdRaw = holds?.[0]?.console_type_id;

    if (consoleTypeIdRaw == null) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message: "No recent reservation hold found for user",
        },
        { status: 404 }
      );
    }

    const consoleTypeId = Number(consoleTypeIdRaw);
    if (!Number.isFinite(consoleTypeId)) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message: "Invalid console type id in hold",
        },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `SELECT accessoire_type_id, name
         FROM accessoires_catalog
        WHERE console_type_ids IS NOT NULL
          AND JSON_VALID(console_type_ids)
          AND JSON_CONTAINS(console_type_ids, JSON_ARRAY(?)) 
        AND hidden_units = 0
        ORDER BY name`,
      [consoleTypeId]
    );

    // Typage / mapping corrects
    const accessories =
      (rows as { accessoire_type_id: number; name: string }[]) || [];

    if (accessories.length === 0) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          message: "No accessories found for the user's console",
        },
        { status: 404 }
      );
    }

    const payload = accessories.map((a) => ({
      id: a.accessoire_type_id,
      name: a.name,
    }));

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { success: false, data: [], message: "Internal server error" },
      { status: 500 }
    );
  }
}
