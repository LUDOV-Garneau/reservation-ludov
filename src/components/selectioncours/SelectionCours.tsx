"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function SelectionCours() {
  const [cours, setCours] = useState("")

  return (
    <div className="md:mx-auto md:w-[50%] space-y-6 mt-6">
      <h2 className="text-3xl font-semibold">Sélection du cours</h2>
      <p className="text-gray-600">
        Veuillez fournir le sigle du cours pour lequel vous effectuez la réservation :
      </p>

      <div className="flex flex-col gap-3">
        <select
          id="cours"
          value={cours}
          onChange={(e) => setCours(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Choisir un cours</option>
          <option value="ART2101">Expression graphique numérique</option>
          <option value="JEU1001">Histoire du jeu vidéo 1 (des débuts à 1990)</option>
          <option value="JEU1002">Analyse vidéoludique</option>
          <option value="JEU1003">Jeu vidéo et cinéma</option>
          <option value="JEU1004">Immersion et expériences médiatisées</option>
          <option value="JEU1005">Les genres et le jeu vidéo</option>
          <option value="Autre">Autre</option>
        </select>
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
