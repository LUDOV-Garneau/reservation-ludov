"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { useState } from "react"

export default function LoginForm({ onSignup }: { onSignup: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [showErrorAlert, setShowErrorAlert] = useState(false)
  const [alertErrorMessage, setAlertErrorMessage] = useState("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const validateField = (name: string, value: string) => {
    let errorMsg = ""

    switch (name) {
      case "email":
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errorMsg = "Adresse courriel invalide."
        }
        break
      case "password":
        if (value === "") {
          errorMsg = "Veuillez entrer un mot de passe."
        } else if (value.length < 6) {
          errorMsg = "Le mot de passe doit contenir au moins 6 caractères."
        }
        break
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }))
    return errorMsg
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    validateField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = {
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some((error) => error)) {
      setShowErrorAlert(true)
      setAlertErrorMessage("Veuillez corriger les erreurs du formulaire.")
      return
    }

    try {
      setIsLoading(true)
      // 🔹 ton appel backend ex: await auth.login(formData.email, formData.password)
      console.log("Tentative connexion :", formData)
      setIsLoading(false)
    } catch (e) {
      setIsLoading(false)
      setShowErrorAlert(true)
      setAlertErrorMessage((e as Error).message)
    }
  }

  return (
    <div className="md:mx-auto md:w-[50%]">
      <h1 className="text-6xl font-semibold">Connexion</h1>

      {showErrorAlert && (
        <Alert variant="destructive" className="text-left my-5">
          <AlertCircleIcon />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            <p>{alertErrorMessage}</p>
          </AlertDescription>
        </Alert>
      )}

      <form
        noValidate
        method="POST"
        onSubmit={handleSubmit}
        className="mt-10 space-y-10"
      >
        <div className="flex flex-col gap-3">
          <Label htmlFor="email">Courriel</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={!formData.email || !formData.password || isLoading}
          className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>

      <Button
        variant={"black"}
        type="button"
        onClick={onSignup}
        className="mt-10 inline-block text-sm w-full"
      >
        Première connexion ?
      </Button>
    </div>
  )
}
