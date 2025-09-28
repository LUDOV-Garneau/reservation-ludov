"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Clock9 } from "lucide-react";

type Jeu = { nom: string };
type Console = { nom: string };
type Accessoire = { nom: string };

type ConfirmerReservationProps = {
    jeux: Jeu[];
    console: Console;
    accessoires?: Accessoire[];
    cours: string;
    date: string;
    heure: string
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
                <h2 className="text-3xl font-semibold">Sélection du cours</h2>

                <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <div className="flex flex-1 flex-wrap items-center gap-2 sm:flex-none">
                        {date && heure && (
                            <span className="inline-flex items-center gap-3 rounded-md border bg-white px-3 py-1 text-sm shadow-sm">
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
                    </div>

                    <div className="flex flex-1 justify-stretch gap-2 sm:flex-none">
                        <Button
                            type="button"
                            onClick={onConfirmer}
                            className="flex-1 sm:flex-none h-11 w-full bg-cyan-300 text-black hover:bg-cyan-500">
                            Confirmer ma réservation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
