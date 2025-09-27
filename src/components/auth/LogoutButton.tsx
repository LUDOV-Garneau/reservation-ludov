"use client";
import { UserIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { useState } from "react";

interface LogoutButtonProps {
  name: string;
}

export default function LogoutButton({ name }: LogoutButtonProps) {
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
    } catch (e) {
      console.error("Erreur lors de la déconnexion");
      setIsLoading(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger>
        <div className="flex items-center gap-4 hover:opacity-70">
          <UserIcon color="black" size={24} fill="black" />
          <p>{name || ""}</p>
        </div>
      </PopoverTrigger>
      <PopoverContent
        asChild
        className="border-2 border-black"
        onClick={logout}
      >
        <Button
          disabled={isLoading}
          className="w-fit text-white font-bold bg-red-400 hover:bg-red-300 border-2 border-black"
        >
          {isLoading ? "Déconnexion..." : "Se déconnecter"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
