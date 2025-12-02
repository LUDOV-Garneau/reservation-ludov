"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  X,
  Monitor,
  CheckCircle2,
  AlertCircle,
  MonitorCheck,
  PiSquare,
} from "lucide-react";

type ConsoleStock = {
  id: number;
  name: string;
};

type Props = {
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
  trigger: React.ReactNode;
};

export default function AddStationForm({ onSuccess, onAlert, trigger }: Props) {
  const t = useTranslations("admin.stations.addStationForm");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [stationName, setStationName] = useState("");
  const [selectedConsoleId, setSelectedConsoleId] = useState("");
  const [consoleList, setConsoleList] = useState<ConsoleStock[]>([]);
  const [selectedConsoles, setSelectedConsoles] = useState<ConsoleStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchConsoleStock = async () => {
      try {
        const res = await fetch("/api/admin/console-type");
        if (!res.ok) throw new Error(t("errors.consoleFetch"));
        const data: ConsoleStock[] = await res.json();
        setConsoleList(data);
      } catch (err) {
        console.error(err);
        setError(t("errors.consoleFetch"));
      }
    };

    fetchConsoleStock();
  }, [open, t]);

  const clearError = () => setError(null);

  const handleAddConsole = () => {
    if (!selectedConsoleId) return;

    const consoleToAdd = consoleList.find(
      (c) => c.id === Number(selectedConsoleId)
    );
    if (!consoleToAdd) return;

    const isDuplicate = selectedConsoles.some((c) => c.id === consoleToAdd.id);
    if (isDuplicate) {
      setError("Cette unité console est déjà ajoutée !");
      return;
    }

    setSelectedConsoles((prev) => [...prev, consoleToAdd]);
    setSelectedConsoleId("");
    clearError();
  };

  const handleRemoveConsole = (id: number) => {
    setSelectedConsoles((prev) => prev.filter((c) => c.id !== id));
  };

  const resetForm = () => {
    setStationName("");
    setSelectedConsoles([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stationName.trim() || selectedConsoles.length === 0) {
      setError(t("errors.missingFields"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/add-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stationName.trim(),
          consoles: selectedConsoles.map((c) => c.id),
        }),
      });

      if (res.status === 409) {
        setError(t("errors.nameConflict"));
        return;
      }

      if (!res.ok) throw new Error("Erreur API");

      onAlert?.("success", t("alerts.addStationSuccess"));
      router.refresh();
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      onAlert?.("error", t("alerts.addStationError"));
    } finally {
      setLoading(false);
    }
  };

  const availableConsoles = consoleList.filter(
    (console) =>
      !selectedConsoles.some((selected) => selected.id === console.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-[650px] w-full h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <MonitorCheck className="w-5 h-5 text-cyan-600" />
            {t("titles.dialogTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6 max-w-full">
              <div className="space-y-2.5">
                <Label
                  htmlFor="stationName"
                  className="text-sm font-semibold flex items-center gap-2"
                >
                  Nom de la station
                  <span className="text-xs text-red-500">*</span>
                </Label>
                <Input
                  id="stationName"
                  value={stationName}
                  onChange={(e) => {
                    setStationName(e.target.value);
                    clearError();
                  }}
                  placeholder="Ex: Tv Ultra 4K XDR"
                  className="h-11 text-base border-2"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  Consoles associées
                  <span className="text-xs text-red-500">*</span>
                </Label>
                <div className="flex flex-col md:flex-row gap-2">
                  <Select
                    value={selectedConsoleId}
                    onValueChange={setSelectedConsoleId}
                  >
                    <SelectTrigger className="flex-1 border-2 text-base w-full">
                      <SelectValue placeholder="Sélectionner une console..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableConsoles.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Aucune console disponible
                        </SelectItem>
                      ) : (
                        availableConsoles.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={`${c.id}`}
                            className="py-3"
                          >
                            <div className="flex items-center gap-2">
                              <Monitor className="w-4 h-4 text-cyan-500" />
                              <span className="font-medium">{c.name}</span>
                              <span className="text-xs text-muted-foreground">
                                • #{c.id}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    onClick={handleAddConsole}
                    disabled={
                      !selectedConsoleId || availableConsoles.length === 0
                    }
                    className="sm:w-auto w-full gap-2 font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </Button>
                </div>

                {selectedConsoles.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {selectedConsoles.length} console
                      {selectedConsoles.length > 1 ? "s" : ""} sélectionnée
                      {selectedConsoles.length > 1 ? "s" : ""}
                    </p>

                    <div className="space-y-2.5">
                      {selectedConsoles.map((c) => (
                        <div
                          key={c.id}
                          className="group p-3.5 bg-gradient-to-r from-cyan-50 to-cyan-50/50 dark:from-cyan-950/30 dark:to-cyan-950/10 rounded-lg border-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="p-2 bg-cyan-500/10 rounded-lg shrink-0">
                                <Monitor className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {c.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Unité #{c.id}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
                              onClick={() => handleRemoveConsole(c.id)}
                              className="h-8 w-8 shrink-0 hover:bg-red-500 hover:text-white transition-colors rounded-md"
                              aria-label={`Retirer ${c.name}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 text-center border-2 border-dashed rounded-lg bg-muted/30">
                    <Monitor className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Aucune console sélectionnée
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajoutez des consoles à votre station
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          <div className="shrink-0 px-6 pb-4">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading || !stationName.trim() || selectedConsoles.length === 0
              }
              className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {t("button.loading")}
                </>
              ) : (
                <>{t("button.submit")}</>
              )}
            </Button>
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
