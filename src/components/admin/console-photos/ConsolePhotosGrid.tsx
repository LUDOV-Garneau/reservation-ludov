"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import ImageUploadField from "@/components/admin/ImageUploadField";

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
  const [alert, setAlert] = useState<AlertState>(null);

  const showAlert = useCallback((next: NonNullable<AlertState>) => {
    setAlert(next);
    setTimeout(() => setAlert(null), 3500);
  }, []);

  useEffect(() => {
    (async () => {
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
    })();
  }, [showAlert, t]);

  const handleUploaded = useCallback(
    async (consoleTypeId: number, path: string) => {
      try {
        const res = await fetch(`/api/admin/console-type/${consoleTypeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ picture: path }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.error || "Erreur API");

        setConsoles((prev) =>
          prev.map((c) =>
            c.id === consoleTypeId ? { ...c, picture: path } : c,
          ),
        );
        showAlert({ type: "success", message: t("alerts.updateSuccess") });
      } catch (err) {
        console.error(err);
        showAlert({ type: "destructive", message: t("alerts.updateError") });
      }
    },
    [showAlert, t],
  );

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      {alert && (
        <Alert
          variant={alert.type === "destructive" ? "destructive" : "default"}
          className={
            alert.type === "success"
              ? "border-green-200 bg-green-50 text-green-900"
              : ""
          }
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle className="font-semibold">
            {alert.type === "success" ? t("alerts.successTitle") : t("alerts.errorTitle")}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : consoles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consoles.map((consoleRow) => (
            <Card key={consoleRow.id} className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5 text-cyan-500" />
                  {consoleRow.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consoleRow.picture && (
                  <div className="relative h-32 w-full rounded-lg bg-muted/30 overflow-hidden">
                    <Image
                      src={consoleRow.picture}
                      alt={consoleRow.name}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                )}
                <ImageUploadField
                  category="consoles"
                  currentImage={null}
                  onUploaded={(path) => handleUploaded(consoleRow.id, path)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
