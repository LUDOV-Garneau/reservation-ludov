"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import UserAvatar from "./UserAvatar";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";
import UserRowActions from "./UserRowActions";
import { parseDbDate, type AdminUser } from "./types";

type AlertType = "success" | "destructive" | "info" | "warning";

export default function UserRow({
  user,
  isCurrentUser,
  selected,
  onToggleSelect,
  onAlert,
  onSuccess,
}: {
  user: AdminUser;
  isCurrentUser: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("admin.users");
  const locale = useLocale();
  const router = useRouter();

  const dateLocale = locale === "en" ? "en-CA" : "fr-CA";
  const createdAt = parseDbDate(user.createdAt);
  const lastLogin = parseDbDate(user.lastLogin);

  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className="group cursor-pointer"
      onClick={() => router.push(`/admin/user/${user.id}`)}
    >
      <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
        {/* Le compte connecté n'est pas sélectionnable : les endpoints
            refusent déjà l'auto-action, autant ne pas la proposer. */}
        {!isCurrentUser && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(user.id)}
            aria-label={t("bulk.selectOne")}
          />
        )}
      </TableCell>

      <TableCell className="max-w-0">
        <div className="flex items-center gap-3">
          <UserAvatar id={user.id} firstname={user.firstname} lastname={user.lastname} />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium">
              <span className="truncate">
                {user.firstname} {user.lastname}
              </span>
              {/* Dit pourquoi cette ligne n'a ni case ni actions, là où un
                  tiret dans la colonne actions ressemblait à une donnée
                  manquante. */}
              {isCurrentUser && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {t("table.you")}
                </span>
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <RoleBadge isAdmin={Boolean(user.isAdmin)} />
      </TableCell>

      <TableCell>
        <StatusBadge hasPassword={user.hasPassword} />
      </TableCell>

      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
        {lastLogin ? lastLogin.toLocaleDateString(dateLocale) : t("status.never")}
      </TableCell>

      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
        {createdAt ? createdAt.toLocaleDateString(dateLocale) : "—"}
      </TableCell>

      <TableCell className="w-12 text-right">
        {!isCurrentUser && (
          <UserRowActions user={user} onAlert={onAlert} onSuccess={onSuccess} />
        )}
      </TableCell>
    </TableRow>
  );
}
