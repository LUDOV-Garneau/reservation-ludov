"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Search } from "lucide-react"

interface Console {
  id: string
  name: string
  image: string
}

interface ConsoleSelectionGridProps {
  consoles: Console[]
  selectedId: string | null
  onSelect: (c: Console) => void
}

export default function ConsoleSelectionGrid({
  consoles,
  selectedId,
  onSelect,
}: ConsoleSelectionGridProps) {
  const [search, setSearch] = useState("")

  const filtered = consoles.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Nom de la console"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card
            key={c.id}
            onClick={() => onSelect(c)}
            className={`cursor-pointer transition ${
              selectedId === c.id
                ? "ring-2 ring-blue-500"
                : "hover:ring-2 hover:ring-gray-300"
            }`}
          >
            <CardContent className="p-2 flex flex-col items-center">
              <div className="relative w-full aspect-video">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <p className="mt-2 font-semibold">{c.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
