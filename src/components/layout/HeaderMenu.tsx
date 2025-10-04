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
    <div className="flex items-center gap-10">
      {isAdmin && (
        <button
          onClick={openAdminDashboard}
          className={`
            flex items-center gap-2 px-3 py-1 rounded-md border transition
            ${
              isActive
                ? "bg-[#02dcde] text-white border-[#02dcde]"
                : "border-gray-200 hover:bg-gray-100"
            }
          `}
        >
          <ShieldCheck className="w-5 h-5" />
          <p>admin</p>
        </button>
      )}
      <LocaleSwitcher />
      <LogoutButton name={username} />
    </div>
  );
}
