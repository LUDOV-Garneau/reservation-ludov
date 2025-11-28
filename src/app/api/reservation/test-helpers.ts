import { NextRequest } from "next/server";
import type { JwtPayload } from "@/types";

export function createMockJwtPayload(): JwtPayload {
    return {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        isAdmin: false,
    };
}

export function createNextRequestWithCookie(
    url: string,
    cookie?: string
): NextRequest {
    const request = new NextRequest(url, {
        headers: {
            Cookie: cookie || "SESSION=mock-token",
        },
    });
    return request;
}
