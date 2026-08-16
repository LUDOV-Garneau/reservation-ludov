import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";

export const GET = withAuth(async (_req, user) => {
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});
