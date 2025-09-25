"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function SignupPasswordForm({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Créer compte avec mot de passe :", password)
    onDone()
  }

  return (
    <div className="md:mx-auto md:w-[50%]">
      <h1 className="text-6xl font-semibold">Créer un mot de passe</h1>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <div className="flex flex-col gap-3">
          <Label htmlFor="password">Définir un mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label
          htmlFor="confirm-password">
            Confirmer votre mot de passe
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900" disabled={!password}>
          Terminer
        </Button>
      </form>

      <Button
        variant={"black"}
        onClick={onBack}
        className="mt-10 inline-block text-sm w-full"
      >
        Retour
      </Button>
    </div>
  )
}
