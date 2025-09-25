"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface SelectedConsoleCardProps {
  console: { id: string; name: string; image: string } | null
  onClear: () => void
}

export default function SelectedConsoleCard({ console, onClear }: SelectedConsoleCardProps) {
  if (!console) {
    return (
      <Card className="p-6 w-full flex items-center justify-center">
        <p>Aucune console sélectionnée</p>
      </Card>
    )
  }

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
        <Button className="w-full">Continuer</Button>
      </CardContent>
    </Card>
  )
}
