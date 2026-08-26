"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type TargetStation = {
  id: number;
  name: string;
};

export interface DeleteStationActionProps {
  targetStation: TargetStation;
  onSuccess?: () => void;
  onAlert?: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  children: (controls: {
    open: () => void;
    loading: boolean;
  }) => React.ReactNode;
}

export default function DeleteStationAction({
  targetStation,
  onSuccess,
  onAlert,
  children,
}: DeleteStationActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = useTranslations("admin.stations.deleteStationDialog");

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delete-station", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ stationId: targetStation.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || t("alerts.deleteError"));
      }

      const data = await res.json().catch(() => ({}));
      onAlert?.("success", data?.message || t("alerts.deleteSuccess"));
      onSuccess?.();
      setOpen(false);
    } catch (e) {
      onAlert?.(
        "destructive",
        e instanceof Error ? e.message : t("alerts.deleteError")
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) handleConfirm();
  }

  return (
    <>
      {children({ open: () => setOpen(true), loading })}

      <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
          <div className="border-b px-6 py-4 bg-red-50">
            <div className="flex-1 pt-0.5">
              <DialogTitle className="text-lg text-red-900">
                {t("deleteStation")}
              </DialogTitle>
              <DialogDescription className="text-sm text-red-700 mt-1">
                {t("definitiveAction")}
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={onSubmit} className="px-6 pb-5 pt-5 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {targetStation.name ? <>{targetStation.name}</> : "Station"}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto hover:bg-gray-50"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {t("CancelDelete")}
              </Button>
              <Button
                type="submit"
                className={cn(
                  "w-full sm:w-auto",
                  "bg-red-600 hover:bg-red-700",
                  "text-white shadow-md hover:shadow-lg transition-all"
                )}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("deletingState")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {t("confirmDelete")}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
