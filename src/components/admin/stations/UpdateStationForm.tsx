"use client";

import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";

type ConsoleStock = {
  id: number;
  name: string;
};

type Station = {
  id: number;
  name: string;
  consoles: string[];
  consolesId: number[];
  isActive: boolean;
};

type Props = {
  station: Station;
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function UpdateStationForm({
  station,
  onSuccess,
  onAlert,
  open,
  onOpenChange,
}: Props) {
  const t = useTranslations("admin.stations.updateStationForm");

  const [internalOpen, setInternalOpen] = useState(false);
  const openValue = open !== undefined ? open : internalOpen;
  const setOpenValue = onOpenChange ?? setInternalOpen;
  const [stationName, setStationName] = useState(station.name);
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>("");

  const [consoleList, setConsoleList] = useState<ConsoleStock[]>([]);
  const [selectedConsoles, setSelectedConsoles] = useState<ConsoleStock[]>([]);

  const [isActive, setIsActive] = useState(station.isActive);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!openValue) return;

    setStationName(station.name);
    setIsActive(Boolean(station.isActive));
    setSelectedConsoles([]);
    setSelectedConsoleId("");
    setError(null);
  }, [openValue, station]);

  useEffect(() => {
    if (!openValue) return;

    const fetchConsoleStock = async () => {
      try {
        const res = await fetch("/api/admin/console-stock");
        if (!res.ok) throw new Error(t("errors.consoleFetch"));
        const data: ConsoleStock[] = await res.json();
        setConsoleList(data);

        const initial = data.filter((c) =>
          station.consolesId.map((id) => Number(id)).includes(c.id)
        );
        setSelectedConsoles(initial);
      } catch {
        setError(t("errors.consoleFetch"));
      }
    };

    fetchConsoleStock();
  }, [openValue, station.consolesId, t]);

  const handleAddConsole = () => {
    if (!selectedConsoleId) return;

    const consoleToAdd = consoleList.find(
      (c) => c.id === Number(selectedConsoleId)
    );
    if (!consoleToAdd) return;

    if (selectedConsoles.some((c) => c.id === consoleToAdd.id)) {
      setError("Cette unité console est déjà ajoutée !");
      return;
    }

    setSelectedConsoles([...selectedConsoles, consoleToAdd]);
    setSelectedConsoleId("");
    if (error) setError(null);
  };

  const handleRemoveConsole = (id: number) => {
    setSelectedConsoles(selectedConsoles.filter((c) => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stationName || selectedConsoles.length === 0) {
      setError(t("errors.missingFields"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/update-station`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stationName.trim(),
          stationId: station.id,
          consoles: selectedConsoles.map((c) => c.id),
          isActive,
        }),
      });

      if (!res.ok) throw new Error("Erreur API");

      onAlert?.("success", t("alerts.updateSuccess"));
      router.refresh();
      setOpenValue(false);
      onSuccess?.();
    } catch {
      onAlert?.("error", t("alerts.updateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={openValue} onOpenChange={setOpenValue}>
      {onOpenChange ? null : (
        <DialogTrigger asChild>
          <Button variant="ghost">{t("button.openDialog")}</Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-[95vw] md:max-w-[850px] w-full overflow-y-auto overflow-x-hidden max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("titles.dialogTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <Label htmlFor="stationName">{t("fields.stationName")} *</Label>
            <Input
              id="stationName"
              value={stationName}
              onChange={(e) => {
                setStationName(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div>
            <Label>{t("fields.consoles")} *</Label>
            <div className="flex gap-2 mt-1">
              <Select
                value={selectedConsoleId}
                onValueChange={setSelectedConsoleId}
              >
                <SelectTrigger className="max-w-full truncate">
                  <SelectValue placeholder={t("select.placeholder")} />
                </SelectTrigger>

                <SelectContent>
                  {consoleList.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={`${c.id}`}
                      className="truncate"
                    >
                      {c.name} — unité #{c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="button" onClick={handleAddConsole}>
                {t("button.addConsole")}
              </Button>
            </div>

            {selectedConsoles.length > 0 && (
              <ul className="text-sm pl-4 mt-2 list-disc">
                {selectedConsoles.map((c) => (
                  <li key={c.id} className="flex justify-between items-center">
                    <span>
                      #{c.id} — {c.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleRemoveConsole(c.id)}
                    >
                      X
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(Boolean(checked))}
            />
            <Label htmlFor="isActive">{t("fields.isActive")}</Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? t("button.loading") : t("button.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
