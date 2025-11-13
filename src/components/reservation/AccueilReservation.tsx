import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import AccueilReservationsClient from "@/components/reservation/AccueilReservationClient";

export default async function AccueilReservations() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("SESSION");

  let user = null;
  try {
    const token = sessionCookie?.value;
    if (token) {
      user = verifyToken(token);
    }
  } catch {}
  return <AccueilReservationsClient
          username={user?.name || ""}
        />;
}