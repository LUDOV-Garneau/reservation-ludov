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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

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
    <div className="bg-[white] rounded-3xl p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">
            {t("reservation.course.selectionTitle")}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            {t("reservation.course.instruction")}
          </p>
        </div>

        <div className="bg-[white] rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-red-800 mb-1">
                    {t("reservation.course.error")}
                  </p>
                  <p className="text-xs sm:text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            <Label
              htmlFor="cours"
              className="text-base sm:text-lg font-semibold text-gray-900"
            >
              {t("reservation.course.courseLabel")}
            </Label>

            <Select
              onValueChange={handleSelectedCours}
              disabled={loading || saving}
              value={selectedCours ? String(selectedCours) : undefined}
            >
              <SelectTrigger
                id="cours"
                className="w-full h-12 sm:h-14 lg:h-16 text-sm sm:text-base border-2 border-gray-200 hover:border-cyan-400 focus:border-cyan-500 rounded-lg sm:rounded-xl transition-all"
              >
                <SelectValue
                  placeholder={
                    loading
                      ? t("reservation.course.loading")
                      : t("reservation.course.chooseCourse")
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-lg sm:rounded-xl border-2">
                {loading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-sm sm:text-base">
                        {t("reservation.course.loading")}
                      </span>
                    </div>
                  </SelectItem>
                ) : cours.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    <span className="text-sm sm:text-base">
                      {t("reservation.course.noCourseAvailable")}
                    </span>
                  </SelectItem>
                ) : (
                  cours.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={String(c.id)}
                      className="text-sm sm:text-base py-2 sm:py-3 cursor-pointer hover:bg-cyan-50 overflow-auto"
                    >
                      <div className="flex flex-row items-center gap-2">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-600 flex-shrink-0" />
                        <span className="font-semibold text-cyan-700">
                          {c.code_cours}
                        </span>
                        <span className="text-gray-600 hidden sm:inline">
                          -
                        </span>
                        <span className="text-gray-900 break-words">
                          {c.nom_cours}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedCoursDetails && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-cyan-500 rounded-xl sm:rounded-2xl shadow-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0 mt-0.5 sm:mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-white/90 mb-1">
                    {t("reservation.course.selectedCourseLabel")}
                  </p>
                  <p className="text-white text-lg sm:text-xl font-bold break-words">
                    {selectedCoursDetails.code_cours}
                  </p>
                  <p className="text-white/90 text-sm sm:text-base lg:text-lg break-words">
                    {selectedCoursDetails.nom_cours}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={saving}
              className="w-full sm:flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl border-2 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t("reservation.course.return")}
            </Button>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={!selectedCours || loading || saving}
              className="w-full sm:flex-1 h-12 sm:h-14 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="truncate">
                    {t("reservation.course.saveLoading")}
                  </span>
                </>
              ) : (
                <>
                  <span className="truncate">
                    {t("reservation.course.continue")}
                  </span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                </>
              )}
            </Button>
          </div>
        </div>

        {!loading && cours.length > 0 && (
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
            {t("reservation.course.coursesAvailable", {
              count: cours.length,
              plural: cours.length > 1 ? "s" : "",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
