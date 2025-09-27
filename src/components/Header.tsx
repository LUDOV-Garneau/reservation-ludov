import Image from "next/image";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import LogoutButton from "./auth/LogoutButton";
import Link from "next/link";

export default async function Header() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("SESSION");

  let user = null;
  try {
    const token = sessionCookie?.value;
    if (token != undefined) {
      user = verifyToken(token);
    }
  } catch (e) {}

  return (
    <div className="bg-[white]">
      <header className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl flex justify-between items-center">
        <Link href="/">
          <Image
            src="/images/LUDOV-logo-texte.png"
            alt="LUDOV"
            width={1010}
            height={247}
            className="w-[128px] h-auto"
          />
        </Link>
        <LogoutButton name={user?.name || ""} />
      </header>
    </div>
  );
}
