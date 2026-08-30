"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, User } from "lucide-react";
import { useTranslations } from "next-intl";

export default function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations("admin.users.badge");

  return isAdmin ? (
    <Badge className="rounded-full border-0 bg-cyan-500 text-white">
      <Shield className="h-3 w-3" />
      {t("admin")}
    </Badge>
  ) : (
    <Badge variant="outline" className="rounded-full text-muted-foreground">
      <User className="h-3 w-3" />
      {t("user")}
    </Badge>
  );
}
