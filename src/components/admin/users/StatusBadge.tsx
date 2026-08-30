"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MailWarning } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * `hasPassword` vient de `password IS NOT NULL` : un compte créé par l'admin
 * (ou dont le mot de passe a été réinitialisé) reste « jamais configuré » tant
 * que la personne n'a pas défini son mot de passe.
 */
export default function StatusBadge({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations("admin.users.status");

  return hasPassword ? (
    <Badge
      variant="outline"
      className="rounded-full border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
    >
      <CheckCircle2 className="h-3 w-3" />
      {t("active")}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="rounded-full border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
    >
      <MailWarning className="h-3 w-3" />
      {t("pending")}
    </Badge>
  );
}
