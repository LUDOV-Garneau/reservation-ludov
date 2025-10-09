import Image from "next/image";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import HeaderMenu from "@/components/layout/HeaderMenu";
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
  } catch {}

  return (
    <div className="bg-[white]">
      <header className=" px-6 py-[30px] mx-auto w-full flex justify-between items-center">
        <Link href="/">
          <Image
            src="/images/LUDOV-logo-texte.png"
            alt="LUDOV"
            width={1010}
            height={247}
            className="md:w-52 w-[128px] h-auto"
          />
        </Link>
        <HeaderMenu
          isAdmin={user?.isAdmin || false}
          username={user?.name || ""}
        />
      </header>
    </div>
  );
}
