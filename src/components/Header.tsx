import Image from "next/image";
import { UserIcon } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import { User } from "@/types";
import Cookies from "js-cookie";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const token = Cookies.get("SESSION");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const res = await fetch("/api/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }

    fetchUser();
  }, []);

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
        <div className="flex items-center gap-4">
          <UserIcon color="black" size={24} fill="black" />
          <p>{user?.name || "user"}</p>
        </div>
      </header>
    </div>
  );
}
