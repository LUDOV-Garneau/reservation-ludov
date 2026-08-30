"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, KeyRound, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import ResetPasswordAction from "./DialogConfirmationResetsPassword";
import DeleteUserAction from "./DialogConfirmationDeleteUser";
import type { AdminUser } from "./types";

type AlertType = "success" | "destructive" | "info" | "warning";

/**
 * Un seul menu, à tous les breakpoints.
 *
 * La version précédente avait deux chemins : des icônes révélées au survol sur
 * desktop, un menu déroulant sur tactile. Deux fois le même code, et surtout
 * des actions invisibles tant que la souris n'était pas sur la ligne — on ne
 * découvrait « Réinitialiser le mot de passe » que par accident. Un menu
 * toujours visible se voit, s'atteint au clavier et n'a qu'une implémentation.
 */
export default function UserRowActions({
  user,
  onAlert,
  onSuccess,
}: {
  user: AdminUser;
  onAlert: (type: AlertType, message: string, title?: string) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("admin.users.table");
  const router = useRouter();

  const target = {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("actionsFor", {
              name: `${user.firstname} ${user.lastname}`.trim(),
            })}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push(`/admin/user/${user.id}`)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("ActionToolTips.viewProfile")}
          </DropdownMenuItem>

          <ResetPasswordAction targetUser={target} onAlert={onAlert} onSuccess={onSuccess}>
            {({ open }) => (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
                onSelect={(e) => e.preventDefault()}
              >
                <KeyRound className="mr-2 h-4 w-4 text-cyan-500" />
                {t("ActionToolTips.resetPassword")}
              </DropdownMenuItem>
            )}
          </ResetPasswordAction>

          <DropdownMenuSeparator />

          <DeleteUserAction targetUser={target} onAlert={onAlert} onSuccess={onSuccess}>
            {({ open }) => (
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("ActionToolTips.deleteUser")}
              </DropdownMenuItem>
            )}
          </DeleteUserAction>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
