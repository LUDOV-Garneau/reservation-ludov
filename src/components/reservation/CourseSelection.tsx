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

type Cours = {
  id: number;
  code_cours: string;
  nom_cours: string;
};

const COURS_AUTRE: Cours = {
  id: 16,
  code_cours: "Autre",
  nom_cours: "Autre",
};

export default function CourseSelection() {
  const t = useTranslations();

  const [cours, setCours] = useState<Cours[]>([]);
  const [selectedCours, setSelectedCours] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCours() {
      try {
        const res = await fetch("/api/reservation/cours");
        if (!res.ok) throw new Error("Erreur lors du chargement des cours");
        const data = await res.json();
        setCours(data);
      } catch (error) {
        console.error("Erreur chargement cours:", error);
        setCours([COURS_AUTRE]);
      } finally {
        setLoading(false);
      }
    }
    fetchCours();
  }, []);

  return (
    <div className="md:mx-auto md:w-[50%] space-y-6 mt-6">
      <h2 className="text-3xl font-semibold">
        {t("reservation.course.selectionTitle")}
      </h2>
      <p className="text-gray-600">{t("reservation.course.instruction")}</p>

      <div className="flex flex-col gap-3">
        <Label htmlFor="cours" className="sr-only">
          {t("reservation.course.courseLabel")}
        </Label>
        <Select onValueChange={setSelectedCours} disabled={loading}>
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
              cours.map((c) => {
                const label =
                  c.code_cours === c.nom_cours
                    ? c.code_cours
                    : `${c.code_cours} — ${c.nom_cours}`;
                return (
                  <SelectItem key={c.id} value={c.code_cours}>
                    {label}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        disabled={!selectedCours || loading}
        className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
      >
        {t("reservation.course.continue")}
      </Button>
    </div>
  );
}
