"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  Gamepad2,
  Loader2,
  Monitor,
  Pencil,
} from "lucide-react";
import { useTranslations } from "next-intl";

type AccessoryConsole = { id: number; name: string };

type Accessory = {
  id: number;
  name: string;
  kohaId: number;
  hidden: boolean;
  consoles: AccessoryConsole[];
};

type ConsoleTypeOption = { id: number; name: string };

type AlertState = {
  type: "success" | "destructive";
  message: string;
} | null;

export default function AccessoriesTable() {
  const t = useTranslations("admin.accessories");
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [consoleTypes, setConsoleTypes] = useState<ConsoleTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<AlertState>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [editing, setEditing] = useState<Accessory | null>(null);
  const [editSelection, setEditSelection] = useState<number[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const showAlert = useCallback((next: NonNullable<AlertState>) => {
    setAlert(next);
    setTimeout(() => setAlert(null), 3500);
  }, []);

  const fetchAccessories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/accessories");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur API");
      }
      setAccessories(data.accessories);
      setConsoleTypes(data.consoleTypes);
    } catch (err) {
      console.error(err);
      showAlert({ type: "destructive", message: t("alerts.fetchError") });
    } finally {
      setLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    fetchAccessories();
  }, [fetchAccessories]);

  const patchAccessory = useCallback(
    async (id: number, body: { hidden?: boolean; consoles?: number[] }) => {
      const res = await fetch(`/api/admin/accessories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur API");
      }
    },
    [],
  );

  const handleToggleHidden = useCallback(
    async (accessory: Accessory) => {
      const nextHidden = !accessory.hidden;
      setTogglingId(accessory.id);
      // Mise à jour optimiste
      setAccessories((prev) =>
        prev.map((a) =>
          a.id === accessory.id ? { ...a, hidden: nextHidden } : a,
        ),
      );
      try {
        await patchAccessory(accessory.id, { hidden: nextHidden });
        showAlert({ type: "success", message: t("alerts.updateSuccess") });
      } catch (err) {
        console.error(err);
        setAccessories((prev) =>
          prev.map((a) =>
            a.id === accessory.id ? { ...a, hidden: accessory.hidden } : a,
          ),
        );
        showAlert({ type: "destructive", message: t("alerts.updateError") });
      } finally {
        setTogglingId(null);
      }
    },
    [patchAccessory, showAlert, t],
  );

  const openEdit = useCallback((accessory: Accessory) => {
    setEditing(accessory);
    setEditSelection(accessory.consoles.map((c) => c.id));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editing) return;
    setIsSavingEdit(true);
    try {
      await patchAccessory(editing.id, { consoles: editSelection });
      setEditing(null);
      showAlert({ type: "success", message: t("alerts.updateSuccess") });
      fetchAccessories();
    } catch (err) {
      console.error(err);
      showAlert({ type: "destructive", message: t("alerts.updateError") });
    } finally {
      setIsSavingEdit(false);
    }
  }, [editing, editSelection, patchAccessory, fetchAccessories, showAlert, t]);

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

      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Gamepad2 className="h-4 w-4" />
            {t("count", { count: accessories.length })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : accessories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <div className="px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("table.kohaId")}
                    </TableHead>
                    <TableHead>{t("table.consoles")}</TableHead>
                    <TableHead className="text-center">
                      {t("table.visible")}
                    </TableHead>
                    <TableHead className="text-end">
                      {t("table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessories.map((accessory) => (
                    <TableRow key={accessory.id}>
                      <TableCell className="font-medium">
                        {accessory.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {accessory.kohaId}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {accessory.consoles.length === 0 ? (
                            <span className="text-muted-foreground text-sm">
                              {t("noConsole")}
                            </span>
                          ) : (
                            accessory.consoles.map((c) => (
                              <Badge
                                key={c.id}
                                variant="outline"
                                className="gap-1"
                              >
                                <Monitor className="h-3 w-3 text-cyan-500" />
                                {c.name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={!accessory.hidden}
                          disabled={togglingId === accessory.id}
                          onCheckedChange={() => handleToggleHidden(accessory)}
                          aria-label={t("table.visible")}
                        />
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(accessory)}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          {t("editConsoles")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {t("editDialogTitle", { name: editing?.name ?? "" })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
            {consoleTypes.map((c) => {
              const checked = editSelection.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      setEditSelection((prev) =>
                        value
                          ? [...prev, c.id]
                          : prev.filter((id) => id !== c.id),
                      )
                    }
                  />
                  <Monitor className="h-4 w-4 text-cyan-500" />
                  <span className="font-medium text-sm">{c.name}</span>
                </label>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={isSavingEdit}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 gap-2"
            >
              {isSavingEdit && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
