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

export default function SelectionCours() {
  const [cours, setCours] = useState<Cours[]>([]);
  const [selectedCours, setSelectedCours] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCours() {
      try {
        const res = await fetch("/api/reservation/courses");
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
      <h2 className="text-3xl font-semibold">Sélection du cours</h2>
      <p className="text-gray-600">
        Veuillez fournir le sigle du cours pour lequel vous effectuez la
        réservation :
      </p>

      <div className="flex flex-col gap-3">
        <Label htmlFor="cours" className="sr-only">
          Cours
        </Label>
        <Select onValueChange={setSelectedCours} disabled={loading}>
          <SelectTrigger id="cours" className="w-full">
            <SelectValue
              placeholder={loading ? "Chargement..." : "Choisir un cours"}
            />
          </SelectTrigger>
          <SelectContent>
            {cours.length === 0 ? (
              <SelectItem value="loading" disabled>
                Chargement...
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
        Continuer
      </Button>
    </div>
  );
}
