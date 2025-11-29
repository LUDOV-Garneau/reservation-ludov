"use client";

import LocaleSwitcher from "./LocaleSwitcher";
import { usePathname } from "next/navigation";
import { HelpCircleIcon, LogOut, ShieldCheck, UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
interface HeaderMenuProps {
  username: string;
  isAdmin: boolean;
}

export default function HeaderMenu({ username, isAdmin }: HeaderMenuProps) {
  const pathname = usePathname();
  const t = useTranslations("header");
  const [isLoading, setIsLoading] = useState(false);

  const isAdminActive = pathname.includes("/admin");

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
    <div className="flex items-center sm:gap-6 gap-4">
      <LocaleSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-4 hover:opacity-70 cursor-pointer"
          >
            <UserIcon color="black" size={24} fill="black" />
            <p className="sm:block hidden">{username}</p>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="sm:hidden block">
            {username}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="sm:hidden block" />
          {isAdmin && (
            <>
              <DropdownMenuItem className="px-2 py-1">
                <Link
                  href="/admin"
                  className="hover:opacity-70 cursor-pointer flex items-center gap-2 w-full"
                >
                  <ShieldCheck
                    size={20}
                    className={`${isAdminActive && "text-cyan-500"}`}
                  />
                  <p className="text-base w-full">Administration</p>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem className="px-2 py-1">
            <Link
              href="/docs"
              className="hover:opacity-70 cursor-pointer flex items-center gap-2"
            >
              <HelpCircleIcon size={20} />
              <p className="text-base">{t("help")}</p>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="px-2 py-1">
            <button
              onClick={logout}
              className="hover:opacity-70 cursor-pointer flex items-center gap-2 text-red-500"
            >
              <LogOut size={20} />
              {isLoading ? t("logoutLoading") : t("logout")}
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
