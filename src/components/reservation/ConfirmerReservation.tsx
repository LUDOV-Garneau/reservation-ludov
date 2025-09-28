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

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border bg-white shadow-sm">
                    <div className="grid grid-cols-1 gap-0 p-4 sm:grid-cols-[260px_1fr] sm:p-6">
                        <div className="mx-auto w-full max-w-[260px]">
                            <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-200 to-neutral-300" />
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pl-6">
                            <h2 className="text-lg font-semibold">
                                {jeux[0]?.nom ?? "Jeu sélectionné"}
                            </h2>

                            <div className="mt-4 space-y-4 text-sm leading-6">
                                <div>
                                    <p className="font-medium">Description :</p>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                                        {jeux.map((j) => (
                                            <li key={j.nom}>{j.nom}</li>
                                        ))}
                                    </ul>
                                </div>

                                {!!accessoires?.length && (
                                    <div>
                                        <p className="font-medium">Matériel requis :</p>
                                        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                                            {accessoires.map((a) => (
                                                <li key={a.nom}>{a.nom}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div>
                                    <p className="font-medium">Cours :</p>
                                    <p className="text-muted-foreground">{cours}</p>
                                </div>

                                <div>
                                    <Button variant="link" className="px-0">
                                        Plus de détails sur le jeu
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm">
                    <div className="grid grid-cols-1 gap-0 p-4 sm:grid-cols-[1fr] sm:p-6">
                        <div className="mx-auto w-full max-w-[360px]">
                            <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-200 to-neutral-300" />
                        </div>

                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">{console.nom}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Télévision 4k
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <Button
                    type="button"
                    onClick={onConfirmer}
                    className="h-11 w-full bg-cyan-300 text-black hover:bg-cyan-500"
                >
                    Confirmer ma réservation
                </Button>
            </div>
        </div>
    );
}
