"use client";

import { toast } from "sonner";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/admin/EmptyState";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Gamepad2,
  RefreshCw,
  Search,
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
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editing, setEditing] = useState<Accessory | null>(null);
  const [editSelection, setEditSelection] = useState<number[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAccessories();
    setIsRefreshing(false);
  };

  // Filtrage côté client : la liste complète est déjà chargée.
  const visibleAccessories = accessories.filter((accessory) =>
    accessory.name.toLowerCase().includes(search.trim().toLowerCase())
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
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : visibleAccessories.length === 0 ? (
            <EmptyState icon={Gamepad2} title={t("empty")} />
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
                  {visibleAccessories.map((accessory) => (
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
                  className="flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer hover:border-cyan-500 transition-colors"
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
              className="bg-cyan-500 hover:bg-cyan-600 gap-2"
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
