"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function SignupEmailForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Envoyer code à :", email)
    onNext()
  }

  return (
    <div className="md:mx-auto md:w-[50%]">
      <h1 className="text-6xl font-semibold">Inscription</h1>
      <h2 className="mt-10">Veuillez entrer votre courriel institutionnel afin de recevoir un code unique</h2>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <div className="flex flex-col gap-3">
          <Label htmlFor="email">Courriel</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900" disabled={!email}>
          Envoyer le code
        </Button>
      </form>

      <Button
        variant={"black"}
        type="button"
        onClick={onBack}
        className="mt-10 inline-block text-sm w-full"
      >
        Se connecter
      </Button>
    </div>
  )
}
