import Image from "next/image";
import { UserIcon } from "lucide-react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import LogoutButton from "./auth/LogoutButton";

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
        <Image
          src="/images/LUDOV-logo-texte.png"
          alt="LUDOV"
          width={1010}
          height={247}
          className="w-[128px] h-auto"
        />
        <LogoutButton name={user?.name} />
      </header>
    </div>
  );
}
