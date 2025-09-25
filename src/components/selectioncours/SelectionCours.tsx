"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

export default function SelectionCours() {
  const [cours, setCours] = useState("")

  return (
    <div className="md:mx-auto md:w-[50%] space-y-6 mt-6">
      <h2 className="text-3xl font-semibold">Sélection du cours</h2>
      <p className="text-gray-600">
        Veuillez fournir le sigle du cours pour lequel vous effectuez la réservation :
      </p>

      <div className="flex flex-col gap-3">
        <Label htmlFor="cours" className="sr-only">Cours</Label>
        <Select onValueChange={setCours}>
          <SelectTrigger id="cours" className="w-full">
            <SelectValue placeholder="Choisir un cours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ART2101">Expression graphique numérique</SelectItem>
            <SelectItem value="JEU1001">Histoire du jeu vidéo 1 (des débuts à 1990)</SelectItem>
            <SelectItem value="JEU1002">Analyse vidéoludique</SelectItem>
            <SelectItem value="JEU1003">Jeu vidéo et cinéma</SelectItem>
            <SelectItem value="JEU1004">Immersion et expériences médiatisées</SelectItem>
            <SelectItem value="JEU1005">Les genres et le ju vidéo</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        disabled={!cours}
        className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
      >
        Continuer
      </Button>
    </div>
  )
}
