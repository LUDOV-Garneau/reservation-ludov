"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import AddUserForm from "./AddUserForm";
import AddUserCsv from "./AddUserCsv";

type AlertType = "success" | "destructive" | "info" | "warning";

/**
 * Un seul dialogue, deux onglets. Remplace le `DropdownMenu` qui contenait à
 * la fois le formulaire CSV et un `AddUserForm` ouvrant son propre dialogue —
 * un dialogue imbriqué dans un menu déroulant.
 *
 * Une seule phrase d'introduction, dans l'en-tête, plutôt qu'un paragraphe
 * répété dans chaque onglet : elle dit ce que les deux ont en commun, à savoir
 * que le compte est créé sans accès.
 */
export default function AddUserDialog({
  onSuccess,
  onAlert,
}: {
  onSuccess: () => void;
  onAlert: (type: AlertType, message: string, title?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin.users.actionBar");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 text-white transition-colors hover:bg-cyan-600">
          <Plus className="h-4 w-4" />
          <span className="ml-1 hidden md:inline">{t("addUser")}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("addUserDialog.title")}</DialogTitle>
          <DialogDescription>{t("addUserDialog.description")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">
              {t("addUserDialog.manualTab")}
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex-1">
              {t("addUserDialog.csvTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="pt-4">
            <AddUserForm
              onCreated={onSuccess}
              onClose={() => setOpen(false)}
              onAlert={(type, message) => onAlert(type, message)}
            />
          </TabsContent>

          <TabsContent value="csv" className="pt-4">
            <AddUserCsv
              onSuccess={() => {
                onSuccess();
              }}
              onAlert={onAlert}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
