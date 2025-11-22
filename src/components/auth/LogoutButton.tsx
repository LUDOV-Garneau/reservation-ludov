"use client";
import { UserIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface LogoutButtonProps {
  name: string;
}

export default function LogoutButton({ name }: LogoutButtonProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        window.location.href = "/auth";
      } else {
        console.error("Déconnexion échouée");
      }
      setIsLoading(false);
    } catch {
      console.error("Erreur lors de la déconnexion");
      setIsLoading(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex items-center gap-4 hover:opacity-70 cursor-pointer">
          <UserIcon color="black" size={24} fill="black" />
          <p className="sm:block hidden">{name || ""}</p>
        </div>
      </PopoverTrigger>
      <PopoverContent
        asChild
        onClick={logout}
      >
        <Button
          disabled={isLoading}
          className="w-fit text-white font-bold bg-red-600 hover:bg-red-500"
        >
          {isLoading ? t("header.logoutLoading") : t("header.logout")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
