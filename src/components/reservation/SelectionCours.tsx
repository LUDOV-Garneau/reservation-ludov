"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Cours = {
    id: number;
    code_cours: string;
    nom_cours: string;
};

export default function SelectionCours() {
    const [cours, setCours] = useState<Cours[]>([]);
    const [selectedCours, setSelectedCours] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCours() {
            try {
                const res = await fetch("/api/reservation/cours");
                if (!res.ok) throw new Error("Erreur lors du chargement des cours");
                const data = await res.json();
                setCours(data);
            } catch (error) {
                setError("Impossible de récupérer les cours");
            } finally {
                setLoading(false);
            }
        }
        fetchCours();
    }, []);

    if (loading) return <p>Chargement des cours...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="md:mx-auto md:w-[50%] space-y-6 mt-6">
            <h2 className="text-3xl font-semibold">Sélection du cours</h2>
            <p className="text-gray-600">
                Veuillez fournir le sigle du cours pour lequel vous effectuez la réservation :
            </p>

            <div className="flex flex-col gap-3">
                <Label htmlFor="cours" className="sr-only">Cours</Label>
                <Select onValueChange={setSelectedCours}>
                    <SelectTrigger id="cours" className="w-full">
                        <SelectValue placeholder="Choisir un cours" />
                    </SelectTrigger>
                    <SelectContent>
                        {cours.map((c) => {
                            const label =
                                c.code_cours === c.nom_cours ? c.code_cours : `${c.code_cours} — ${c.nom_cours}`;
                            return (
                                <SelectItem key={c.id} value={c.code_cours}>
                                    {label}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            <Button
                type="button"
                disabled={!selectedCours}
                className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
            >
                Continuer
            </Button>
        </div>
    );
}
