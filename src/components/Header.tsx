"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { User } from "@/types/user";
import { UserIcon } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getConnectedUser() {
      const activeSession = localStorage.getItem("SESSION");

      if (!activeSession) {
        setUser(null);
        return;
      }

      try {
        const res = await fetch("/api/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${activeSession}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      }
    }

    getConnectedUser();
  }, []);

  return (
    <div className="background-white">
      <header className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl flex justify-between items-center">
        <Image
          src="/images/LUDOV-logo-texte.png"
          alt="LUDOV"
          width={1010}
          height={247}
          className="w-[128px] h-auto"
        />
        {user ? (
          <div className="flex items-center gap-4">
            <UserIcon color="black" size={24} fill="black" />
            <p>{user.name}</p>
          </div>
        ) : (
          <a
            href="#"
            className="border-2 border-black rounded-4xl px-4 py-2 hover:bg-[#02dcde] transition-all duration-300"
          >
            Connexion
          </a>
        )}
      </header>
    </div>
  );
}
