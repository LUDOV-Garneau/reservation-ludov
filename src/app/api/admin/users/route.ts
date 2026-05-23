import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import db from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("SESSION");
    let user = null;
    try {
      const token = sessionCookie?.value;
      if (token) user = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
    }
    if (!user?.id) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (!user?.isAdmin) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const rows = await db.query.users.findMany({
      columns: { id: true, email: true, createdAt: true, firstname: true, lastname: true, isAdmin: true },
      orderBy: (t, { asc }) => [asc(t.id)],
      limit,
      offset,
    });

    const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(users);

    return NextResponse.json({ rows, total });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
