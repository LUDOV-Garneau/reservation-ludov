import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { readSession } from "./lib/session";

const i18nMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathWithoutLocale = pathname.replace(/^\/(fr|en)(?=\/|$)/, "");

  if (pathWithoutLocale.startsWith("/auth") || pathWithoutLocale.startsWith("/docs")) {
    return i18nMiddleware(request);
  }

  // `readSession` relit `users.session_version` : une signature valide ne
  // suffit pas, un mot de passe réinitialisé doit fermer les sessions ouvertes
  // ailleurs. Le middleware tourne en runtime Node (voir `config`) et partage
  // le pool de connexions du reste de l'application.
  const token = request.cookies.get("SESSION")?.value;
  const session = await readSession(token);

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
