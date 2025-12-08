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
import {
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MoveLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CourseSelection() {
  const t = useTranslations();

  const {
    reservationId,
    setCurrentStep,
    setSelectedCours,
    selectedCours,
    currentStep,
  } = useReservation();

  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCours() {
      try {
        const res = await fetch("/api/reservation/cours");
        if (!res.ok) throw new Error(t("reservation.course.saveError"));
        const data = await res.json();
        setCours(data);
      } catch (error) {
        console.error("Erreur chargement cours:", error);
        setError(t("reservation.course.noCourseAvailable"));
      } finally {
        setLoading(false);
      }
    }
    fetchCours();
  }, [t]);

  const handleSave = async () => {
    if (!selectedCours || !reservationId) {
      setError(t("reservation.course.selectCourseError"));
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
          coursId: selectedCours,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || t("reservation.course.saveError"));
      }

      setCurrentStep(currentStep + 1);
    } catch (err) {
      setError(t("reservation.course.saveFailed"));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectedCours = (value: string) => {
    setSelectedCours(Number(value));
    setError(null);
  };

  const selectedCoursDetails = cours.find((c) => c.id === selectedCours);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-[white] rounded-2xl shadow-lg px-10 py-10">
        <div className="mb-8">
          <div
            onClick={() => setCurrentStep(currentStep - 1)}
            className="cursor-pointer flex flex-row items-center mb-8 w-fit"
          >
            <MoveLeft className="h-6 w-6 mr-2" />
            <p>{t("reservation.layout.previousStep")}</p>
          </div>
          <h2 className="text-4xl font-bold mb-2">
            {t("reservation.course.selectionTitle")}
          </h2>
          <p className="text-gray-600">
            {t("reservation.course.instruction")}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  {t("reservation.course.error")}
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-xl mx-auto mb-8">
          <Label
            htmlFor="cours"
            className="text-base font-semibold text-gray-900 mb-2 block"
          >
            {t("reservation.course.courseLabel")}
          </Label>

          {loading ? (
            <Skeleton className="w-full h-14 rounded-lg" />
          ) : (
            <Select
              onValueChange={handleSelectedCours}
              disabled={loading || saving}
              value={selectedCours ? String(selectedCours) : undefined}
            >
              <SelectTrigger
                id="cours"
                className="w-full h-14 text-base px-4 border-2 border-gray-200 bg-[white] text-left font-normal rounded-lg transition-all focus:ring-0 focus:ring-offset-0 show-svg"
              >
                <SelectValue
                  placeholder={
                    loading
                      ? t("reservation.course.loading")
                      : t("reservation.course.chooseCourse")
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] rounded-lg border-2">
                {cours.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    <span className="text-base text-gray-500">
                      {t("reservation.course.noCourseAvailable")}
                    </span>
                  </SelectItem>
                ) : (
                  cours.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={String(c.id)}
                      className="text-base py-3 cursor-pointer hover:bg-cyan-50 focus:bg-cyan-50"
                    >
                      <div className="flex flex-row items-center gap-2">
                        <BookOpen className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                        <span className="font-semibold text-cyan-700">
                          {c.code_cours}
                        </span>
                        <span className="text-gray-400 font-light">|</span>
                        <span className="text-gray-900">{c.nom_cours}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {selectedCoursDetails && (
            <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-100 p-2 rounded-full">
                  <BookOpen className="h-5 w-5 text-cyan-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-cyan-900 mb-1">
                    {t("reservation.course.selectedCourseLabel")}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <p className="text-lg font-bold text-cyan-800">
                      {selectedCoursDetails.code_cours}
                    </p>
                    <p className="text-cyan-700 text-base">
                      {selectedCoursDetails.nom_cours}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-3 pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={saving}
          >
            {t("reservation.course.return")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedCours || loading || saving}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-md transition-all hover:shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>{t("reservation.course.saveLoading")}</span>
              </>
            ) : (
              t("reservation.course.continue")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
