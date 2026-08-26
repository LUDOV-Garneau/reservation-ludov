"use client";

import { toast } from "sonner";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Monitor, RefreshCw, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import ImageUploadField from "@/components/admin/ImageUploadField";
import RemoveConsolePhotoAction from "@/components/admin/console-photos/DialogConfirmationRemoveConsolePhoto";

type ConsoleTypeRow = {
  id: number;
  name: string;
  picture: string | null;
};

type AlertState = {
  type: "success" | "destructive";
  message: string;
} | null;

export default function ConsolePhotosGrid() {
  const t = useTranslations("admin.consolePhotos");
  const [consoles, setConsoles] = useState<ConsoleTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rétroaction sous forme de toast (sonner) plutôt que de bannière dans la
  // page ; le <Toaster> est monté dans app/[locale]/layout.tsx.
  const showAlert = useCallback(
    (next: NonNullable<AlertState>) => {
      if (next.type === "success") {
        toast.success(t("alerts.successTitle"), { description: next.message });
      } else {
        toast.error(t("alerts.errorTitle"), { description: next.message });
      }
    },
    [t]
  );

  const fetchConsoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/console-type");
      if (!res.ok) throw new Error("Erreur API");
      setConsoles(await res.json());
    } catch (err) {
      console.error(err);
      showAlert({ type: "destructive", message: t("alerts.fetchError") });
    } finally {
      setLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    fetchConsoles();
  }, [fetchConsoles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConsoles();
    setIsRefreshing(false);
  };

  // picture = null retire la photo (la colonne accepte NULL côté API).
  const updatePicture = useCallback(
    async (consoleTypeId: number, picture: string | null) => {
      const isRemoval = picture === null;
      try {
        const res = await fetch(`/api/admin/console-type/${consoleTypeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ picture }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setConsoles((prev) =>
          prev.map((c) => (c.id === consoleTypeId ? { ...c, picture } : c)),
        );
        showAlert({
          type: "success",
          message: isRemoval
            ? t("alerts.removeSuccess")
            : t("alerts.updateSuccess"),
        });
      } catch (err) {
        console.error(err);
        showAlert({
          type: "destructive",
          message: isRemoval ? t("alerts.removeError") : t("alerts.updateError"),
        });
      }
    },
    [showAlert, t],
  );

  // Filtrage côté client : la liste complète est déjà chargée.
  const visibleConsoles = consoles.filter((consoleRow) =>
    consoleRow.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">


      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="hover:bg-gray-100 flex-shrink-0"
                    aria-busy={isRefreshing}
                    aria-live="polite"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("refresh")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : visibleConsoles.length === 0 ? (
        <EmptyState icon={Monitor} title={t("empty")} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleConsoles.map((consoleRow) => (
            <Card key={consoleRow.id} className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5 text-cyan-500" />
                  {consoleRow.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consoleRow.picture ? (
                  // Photo en place : pas de dépôt de fichier tant qu'elle n'a
                  // pas été retirée, pour éviter un remplacement accidentel.
                  <>
                    <div className="relative h-32 w-full rounded-lg bg-muted/30 overflow-hidden">
                      <Image
                        src={consoleRow.picture}
                        alt={consoleRow.name}
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <RemoveConsolePhotoAction
                      consoleName={consoleRow.name}
                      onConfirm={() => updatePicture(consoleRow.id, null)}
                    >
                      {({ open, loading }) => (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={open}
                          disabled={loading}
                          className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("removeImage")}
                        </Button>
                      )}
                    </RemoveConsolePhotoAction>
                  </>
                ) : (
                  <ImageUploadField
                    category="consoles"
                    currentImage={null}
                    onUploaded={(path) => updatePicture(consoleRow.id, path)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
