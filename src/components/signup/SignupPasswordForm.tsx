"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function SignupPasswordForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Créer compte avec mot de passe", password)
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Inscription - Étape 3</h1>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Définir un mot de passe</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <Button type="submit" className="w-full">Terminer</Button>

      <button type="button" onClick={onBack} className="text-sm underline block mx-auto">
        Retour
      </button>
    </form>
  )
}
