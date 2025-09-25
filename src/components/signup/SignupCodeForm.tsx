"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export default function SignupCodeForm({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [code, setCode] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Vérifier code :", code)
    onNext()
  }

  return (
    <div className="md:mx-auto md:w-[50%]">
      <h1 className="text-6xl font-semibold">Code unique</h1>
      <h2 className="mt-5">Veuillez entrer le code unique qui vous à été envoyé par courriel</h2>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 justify-center mx-auto">
            <Label htmlFor="code">Code reçu par courriel</Label>
            <InputOTP maxLength={6} onChange={setCode}>
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
          </div>

        </div>

        <Button type="submit" className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900" disabled={code.length !== 6}>
          Vérifier le code
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
