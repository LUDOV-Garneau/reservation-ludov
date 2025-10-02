"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

type Accessory = {
  id: number;
  name: string;
  console_id: number[];
};

interface SelectedAccessoryCardProps {
  accessory: Accessory;
  onClear: () => void;
}

export default function SelectedAccessoryCard({
  accessory,
  onClear,
}: SelectedAccessoryCardProps) {
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!accessory) {
    return (
      <Card className="p-6 w-full flex items-center justify-center">
        <p>{t("reservation.accessory.noneSelected")}</p>
      </Card>
    );
  }

  const handlePost = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservation/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessoryId: accessory.id }),
      });

      setIsLoading(false);

      if (!res.ok) {
        setError(t("reservation.accessory.postError"));
        return;
      }
    } catch (e) {
      setIsLoading(false);
      setError(t("reservation.accessory.networkError", { error: String(e) }));
    }
  };
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg">
      <h3 className="font-medium">{accessory.name}</h3>
      <button
        onClick={onClear}
        className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
