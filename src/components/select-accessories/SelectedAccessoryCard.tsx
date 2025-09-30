"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Accessory = {
  id: number;
  name: string;
  console_id: number[];
};

interface SelectedAccessoryCardProps {
  accessory: Accessory | null;
  onClear: () => void;
}

export default function SelectedAccessoryCard({
  accessory,
  onClear,
}: SelectedAccessoryCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!accessory) {
    return (
      <Card className="p-6 w-full flex items-center justify-center">
        <p>Aucun accessoire sélectionné</p>
      </Card>
    );
  }

  const handlePost = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/accessories/select-accessory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessoryId: accessory.id }),
      });

      setIsLoading(false);

      if (!res.ok) {
        setError("Impossible d'enregistrer l'accessoire sélectionné.");
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
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{accessory.name}</h3>
          <button
            onClick={onClear}
            className="bg-black/60 text-white rounded-full px-2"
          >
            ✕
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button onClick={handlePost} disabled={isLoading} className="w-full">
          {isLoading ? "Envoi..." : "Continuer"}
        </Button>
      </CardContent>
    </Card>
  );
}
