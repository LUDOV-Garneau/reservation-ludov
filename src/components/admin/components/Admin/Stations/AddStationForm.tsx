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

type ConsoleType = {
  id: number;
  name: string;
  picture?: string;
  active_units: number;
  total_units: number;
};

type Props = {
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
};

export default function AddStationForm({ onSuccess, onAlert }: Props) {
  const t = useTranslations("admin.stations.addStationForm");

  const [open, setOpen] = useState(false);
  const [stationName, setStationName] = useState("");
  const [selectedConsoleId, setSelectedConsoleId] = useState<string>("");
  const [consoleList, setConsoleList] = useState<ConsoleType[]>([]);
  const [selectedConsoles, setSelectedConsoles] = useState<ConsoleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const fetchConsoles = async () => {
      try {
        const res = await fetch("/api/reservation/consoles");
        if (!res.ok) throw new Error("Erreur de requête");
        const data: ConsoleType[] = await res.json();
        setConsoleList(data);
      } catch (err) {
        console.error(err);
        setError(t("errors.consoleFetch"));
      }
    };

    fetchConsoles();
  }, [open, t]);

  const handleAddConsole = () => {
    if (!selectedConsoleId) return;

    const consoleToAdd = consoleList.find(
      (c) => c.id === Number(selectedConsoleId)
    );
    if (!consoleToAdd) return;

    const alreadyAdded = selectedConsoles.some((c) => c.id === consoleToAdd.id);
    if (alreadyAdded) {
      setError(t("errors.consoleAlreadyAdded"));
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
      const res = await fetch("/api/admin/add-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stationName.trim(),
          consoles: selectedConsoles.map((c) => c.id),
        }),
      });

      if (!res.ok) throw new Error("Erreur API");

      onAlert?.("success", t("alerts.addStationSuccess"));
      router.refresh();

      setStationName("");
      setSelectedConsoles([]);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      onAlert?.("error", t("alerts.addStationError"));
    } finally {
      setLoading(false);
    }
  };

  //**AJOUTER UNE FAÇON DE NE PAS POUVOIR AJOUTER 2 FOIS LA MÊME CONSOLE**
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">{t("button.openDialog")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
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
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholders.selectConsole")} />
                </SelectTrigger>
                <SelectContent>
                  {consoleList.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.active_units}/{c.total_units})
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
                    <span>{c.name}</span>
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
