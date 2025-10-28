import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { verifyToken } from "./lib/jwt";

const i18nMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathWithoutLocale = pathname.replace(/^\/(fr|en)(?=\/|$)/, "");

  if (pathWithoutLocale.startsWith("/auth")) {
    return i18nMiddleware(request);
  }

  const token = request.cookies.get("SESSION")?.value;
  const session = verifyToken(token || "");

  if (!session) {
    const response = i18nMiddleware(request);

    const locale =
      response.headers.get("x-middleware-request-params-locale") ??
      routing.defaultLocale;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth`;
    return NextResponse.redirect(url);
  }

  if (pathWithoutLocale.startsWith("/admin") && !session.isAdmin) {
    const url = new URL("/not-found", request.url);
    return NextResponse.redirect(url);
  }

  return i18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*|favicon.ico|robots.txt|images).*)"],
  runtime: "nodejs",
};
