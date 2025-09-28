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

}
