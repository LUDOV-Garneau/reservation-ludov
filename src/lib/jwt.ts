import jwt from "jsonwebtoken";
import type { JwtPayload } from "@/types";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const SECRET_KEY = process.env.JWT_SECRET;

export function signToken(payload: object): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (typeof decoded === "string") {
      return null;
    }
    return decoded as JwtPayload;
  } catch {
    return null;
  }
}
