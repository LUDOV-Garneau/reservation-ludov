"use client";

import LogoutButton from "@/components/auth/LogoutButton";
import LocaleSwitcher from "./LocaleSwitcher";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

interface HeaderMenuProps {
  username: string;
  isAdmin: boolean;
}

export default function HeaderMenu({ username, isAdmin }: HeaderMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = pathname.includes("/admin");

  function openAdminDashboard() {
    router.push("/admin");
  }

  return (
    <div className="flex items-center sm:gap-6 gap-4">
      <LocaleSwitcher />
      {isAdmin && (
        <button
          onClick={openAdminDashboard}
          className="hover:opacity-70 cursor-pointer"
        >
          <ShieldCheck color={`${isActive ? "#02dcde" : "black"}`} size={24} />
        </button>
      )}
      <LogoutButton name={username} />
    </div>
  );
}
