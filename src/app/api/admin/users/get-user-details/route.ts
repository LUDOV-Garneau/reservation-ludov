import db from "@/db";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("SESSION")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = verifyToken(token);
    if (!user?.isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const userIdParam = req.nextUrl.searchParams.get("userId");
    const userId = userIdParam ? Number(userIdParam) : NaN;

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Bad Request: Invalid userId" }, { status: 400 });
    }

    const userData = await db.query.users.findFirst({
      columns: { id: true, firstname: true, lastname: true, email: true, isAdmin: true, lastUpdatedAt: true, createdAt: true, lastLogin: true },
      where: (t) => eq(t.id, userId),
    });

    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
