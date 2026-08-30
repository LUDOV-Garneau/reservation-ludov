"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import UserAvatar from "../UserAvatar";
import RoleBadge from "../RoleBadge";
import StatusBadge from "../StatusBadge";
import ResetPasswordAction from "../DialogConfirmationResetsPassword";
import DeleteUserAction from "../DialogConfirmationDeleteUser";
import EditUserDialog from "./EditUserDialog";
import type { UserDetails } from "./useUserDetail";

type AlertType = "success" | "destructive" | "info" | "warning";

/**
 * Sur son propre compte, les deux actions destructrices restent visibles mais
 * désactivées, avec la raison en infobulle : les masquer donnait l'impression
 * qu'elles n'existaient pas sur cette page. Ce sont les routes qui refusent
 * réellement l'auto-action — l'état désactivé ne fait que l'annoncer.
 */
function SelfDisabledAction({
  label,
  reason,
  icon,
  className,
}: {
  label: string;
  reason: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        {/* `span` : un bouton désactivé n'émet pas d'événement de survol, donc
            l'infobulle ne s'ouvrirait jamais sans cet intermédiaire. */}
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button variant="outline" size="sm" disabled className={className}>
              {icon}
              {label}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function UserDetailHeader({
  user,
  isSelf,
  onChanged,
  onAlert,
}: {
  user: UserDetails;
  isSelf: boolean;
  onChanged: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
}) {
  const t = useTranslations("admin.users.detail");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const target = {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  };

  const destructiveClass =
    "text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <UserAvatar
          id={user.id}
          firstname={user.firstname}
          lastname={user.lastname}
          className="h-14 w-14 text-lg"
        />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {user.firstname} {user.lastname}
          </h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge isAdmin={Boolean(user.isAdmin)} />
            <StatusBadge hasPassword={user.hasPassword} />
            {isSelf && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {t("you")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil />
          {t("actions.edit")}
        </Button>

        {isSelf ? (
          <>
            <SelfDisabledAction
              label={t("actions.resetPassword")}
              reason={t("actions.cannotResetSelf")}
              icon={<KeyRound />}
            />
            <SelfDisabledAction
              label={t("actions.delete")}
              reason={t("actions.cannotDeleteSelf")}
              icon={<Trash2 />}
              className={destructiveClass}
            />
          </>
        ) : (
          <>
            <ResetPasswordAction targetUser={target} onAlert={onAlert} onSuccess={onChanged}>
              {({ open, loading }) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => open()}
                  disabled={loading}
                >
                  <KeyRound />
                  {t("actions.resetPassword")}
                </Button>
              )}
            </ResetPasswordAction>

            <DeleteUserAction
              targetUser={target}
              onAlert={onAlert}
              // Le compte n'existe plus : rester sur sa fiche n'a pas de sens.
              onSuccess={() => router.push("/admin?tab=users")}
            >
              {({ open, loading }) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => open()}
                  disabled={loading}
                  className={destructiveClass}
                >
                  <Trash2 />
                  {t("actions.delete")}
                </Button>
              )}
            </DeleteUserAction>
          </>
        )}
      </div>

      <EditUserDialog
        user={user}
        isSelf={isSelf}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={onChanged}
        onAlert={onAlert}
      />
    </div>
  );
}
