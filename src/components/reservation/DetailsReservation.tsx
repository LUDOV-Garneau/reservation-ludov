"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock9 } from "lucide-react";
import CarteElement from "./CarteElement";

type Jeu = { nom: string, };
type Console = { nom: string };
type Accessoire = { nom: string };

type ConfirmerReservationProps = {
    jeux: Jeu[];
    console: Console;
    accessoires?: Accessoire[];
    cours: string;
    date: string;
    heure: string;
    onConfirmer: () => void;
};

export default function ConfirmerReservation({
    jeux,
    console,
    accessoires,
    cours,
    date,
    heure,
    onConfirmer,
}: ConfirmerReservationProps) {
    return (
        <div className="mx-auto max-w-6xl p-4 md:p-6">
            <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-5xl font-semibold">Votre réservation</h2>

                <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center rounded-md border bg-white p-3 shadow-sm">
                    {date && heure && (
                        <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap sm:mr-8">
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {date}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="inline-flex items-center gap-1">
                                <Clock9 className="h-4 w-4" />
                                {heure}
                            </span>
                        </span>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                        <Button
                            type="button"
                            onClick={onConfirmer}
                            className="h-auto py-1 px-3 w-full sm:w-auto bg-cyan-300 text-black hover:bg-cyan-500 whitespace-nowrap text-sm"
                        >
                            Ajouter dans mon calendrier
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onConfirmer}
                            className="h-auto py-1 px-3 w-full sm:w-auto whitespace-nowrap text-sm"
                        >
                            Annuler
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mb-3 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
                <h3 className="text-xl font-medium">Jeux sélectionnés</h3>
                <h3 className="text-xl font-medium hidden md:block">Console</h3>
            </div>

            <div className="mb-8 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {jeux.map((jeu) => (
                        <CarteElement
                            key={jeu.nom}
                            nom={jeu.nom}
                        />
                    ))}
                </div>

                <div className="md:hidden mb-4">
                    <h3 className="text-xl font-medium mb-3">Console</h3>
                </div>
                <CarteElement nom={console.nom} />
            </div>

            {!!accessoires?.length && (
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-medium">Accessoires :</h3>
                        {accessoires.map((acc, index) => (
                            <p key={acc.nom}>
                                {acc.nom}
                                {index < accessoires.length - 1 && ", "}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-8">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-medium">Cours :</h3>
                    <p>{cours}</p>
                </div>
            </div>
        </div>
    );
}