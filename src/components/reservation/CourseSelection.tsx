"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useReservation } from "@/context/ReservationContext";
import { Cours } from "@/types/cours";

export default function CourseSelection() {
  const t = useTranslations();
  const { 
    reservationId, 
    setCurrentStep,
    setSelectedCours,
    selectedCours,
  } = useReservation();

  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCours() {
      try {
        const res = await fetch("/api/reservation/cours");
        if (!res.ok) throw new Error("Erreur lors du chargement des cours");
        const data = await res.json();
        setCours(data);

      } catch (error) {
        console.error("Erreur chargement cours:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCours();
  }, []);

  const handleSave = async () => {
    if (!selectedCours || !reservationId) {
      setError("Veuillez sélectionner un cours");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/reservation/update-hold-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          coursId: selectedCours
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erreur sauvegarde");
      }

      setCurrentStep(6);
    } catch (err) {
      setError("Impossible de sauvegarder le cours.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  function HandleSelectedcours(selectedCours: string) {
    setSelectedCours(Number(selectedCours));
  }

  return (
    <div className="md:mx-auto space-y-6 mt-6 bg-[white] p-10 py-32 rounded-2xl shadow-lg">
      <div className="flex flex-col gap-3 md:w-1/2 mx-auto">
        <h2 className="text-3xl font-semibold">
          {t("reservation.course.selectionTitle")}
        </h2>
        <p className="text-gray-600">{t("reservation.course.instruction")}</p>
        <Label htmlFor="cours" className="sr-only">
          {t("reservation.course.courseLabel")}
        </Label>

        <Select onValueChange={HandleSelectedcours} disabled={loading || saving} value={selectedCours ? String(selectedCours) : undefined}>
          <SelectTrigger id="cours" className="w-full">
            <SelectValue
              placeholder={
                loading
                  ? t("reservation.course.loading")
                  : t("reservation.course.chooseCourse")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {cours.length === 0 ? (
              <SelectItem value="loading" disabled>
                {t("reservation.course.loading")}
              </SelectItem>
            ) : (
              cours.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.code_cours} - {c.nom_cours}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button
          type="button"
          onClick={handleSave}
          disabled={!selectedCours || loading || saving}
          className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
        >
          {saving ? "Enregistrement..." : t("reservation.course.continue")}
        </Button>
      </div>
    </div>
  );
}
