import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
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
    } catch {
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        )
    }
}