"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SelectedConsoleCardProps {
  console: { id: number; name: string; image: string } | null;
  onClear: () => void;
}

export default function SelectedConsoleCard({
  console,
  onClear,
}: SelectedConsoleCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!console) {
    return (
      <Card className="p-6 w-full flex items-center justify-center">
        <p>Aucune console sélectionnée</p>
      </Card>
    );
  }

    const handlePost = async () => {
    setIsLoading(true);
    setError(null);

      try {
      const res = await fetch("/api/consoles/select-console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consoleId: console.id }),
      });

      setIsLoading(false);

      if (!res.ok) {
        setError("Impossible d'enregistrer la console sélectionnée.");
        return;
      }

    } catch (e) {
      setIsLoading(false);
      setError("Erreur réseau, réessayez. " + e);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="relative w-full aspect-square">
          <Image
            src={console.image}
            alt={console.name}
            fill
            className="object-cover rounded-xl"
          />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-2"
          >
            ✕
          </button>
        </div>
        <h2 className="text-lg font-semibold text-center">{console.name}</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button onClick={handlePost} disabled={isLoading} className="w-full">
          {isLoading ? "Envoi..." : "Continuer"}
        </Button>
      </CardContent>
    </Card>
  );
}