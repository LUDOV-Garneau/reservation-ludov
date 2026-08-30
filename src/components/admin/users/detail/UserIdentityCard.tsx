"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Globe, Mail, PenLine, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseDbDate } from "../types";
import type { UserDetails } from "./useUserDetail";

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default function UserIdentityCard({
  user,
  counts,
}: {
  user: UserDetails;
  counts: { total: number; canceled: number; completed: number; upcoming: number };
}) {
  const t = useTranslations("admin.users.detail");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-CA" : "fr-CA";

  const formatDate = (value: string | null, withTime = false) => {
    const date = parseDbDate(value);
    if (!date) return t("never");
    return date.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(withTime && { hour: "2-digit", minute: "2-digit" }),
    });
  };

  return (
    <Card className="lg:sticky lg:top-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-cyan-600" />
          {t("identity")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Field icon={Mail} label={t("fields.email")} value={user.email} />
        <Field
          icon={Globe}
          label={t("fields.locale")}
          value={user.preferredLocale === "en" ? t("edit.localeEn") : t("edit.localeFr")}
        />
        <Field
          icon={Calendar}
          label={t("fields.createdAt")}
          value={formatDate(user.createdAt)}
        />
        <Field
          icon={Clock}
          label={t("fields.lastLogin")}
          value={formatDate(user.lastLogin, true)}
        />
        {/* Récupéré par l'API depuis toujours, jamais affiché jusqu'ici. */}
        <Field
          icon={PenLine}
          label={t("fields.lastUpdatedAt")}
          value={formatDate(user.lastUpdatedAt, true)}
        />

        <div className="grid grid-cols-3 gap-2 border-t pt-4">
          <div className="rounded-lg bg-muted/60 p-3 text-center">
            <p className="text-2xl font-semibold tabular-nums text-cyan-600">
              {counts.upcoming}
            </p>
            <p className="text-xs text-muted-foreground">{t("counts.upcoming")}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3 text-center">
            <p className="text-2xl font-semibold tabular-nums text-emerald-600">
              {counts.completed}
            </p>
            <p className="text-xs text-muted-foreground">{t("counts.completed")}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3 text-center">
            <p className="text-2xl font-semibold tabular-nums text-destructive">
              {counts.canceled}
            </p>
            <p className="text-xs text-muted-foreground">{t("counts.canceled")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
