import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import type { JwtPayload } from "@/types";

type SessionUser = JwtPayload & { id: number };

type AuthHandler<TParams = Record<string, string>> = (
  req: NextRequest,
  user: SessionUser,
  params: TParams
) => Promise<NextResponse>;

type RouteContext<TParams> = { params: Promise<TParams> };

function extractUser(req: NextRequest): SessionUser | null {
  const token = req.cookies.get("SESSION")?.value;
  if (!token) return null;
  const user = verifyToken(token);
  if (!user?.id) return null;
  return user as SessionUser;
}

/**
 * Vérifie que l'utilisateur est connecté.
 * Injecte `user` dans le handler.
 */
export function withAuth<TParams = Record<string, string>>(
  handler: AuthHandler<TParams>
) {
  return async (req: NextRequest, ctx?: RouteContext<TParams>) => {
    const user = extractUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = ctx?.params ? await ctx.params : ({} as TParams);
    return handler(req, user, params);
  };
}

/**
 * Vérifie que l'utilisateur est connecté ET admin.
 * Injecte `user` dans le handler.
 */
export function withAdmin<TParams = Record<string, string>>(
  handler: AuthHandler<TParams>
) {
  return async (req: NextRequest, ctx?: RouteContext<TParams>) => {
    const user = extractUser(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const params = ctx?.params ? await ctx.params : ({} as TParams);
    return handler(req, user, params);
  };
}
