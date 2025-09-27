"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function SignupEmailForm({
  onNext,
  onBack,
}: {
  onNext: (email: string) => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "email":
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errorMsg = "Adresse courriel invalide.";
        }
        break;
    }

    setError(errorMsg);
    return errorMsg;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateField("email", email);

    setError(newErrors);

    if (newErrors != "") {
      return;
    }

    try {
      setIsLoading(true);

      const responseCheckEmail = await fetch(
        `/api/auth/register?email=${encodeURIComponent(email)}`
      );
      if (responseCheckEmail.status == 401) {
        setIsLoading(false);
        setError(
          "Cette adresse courriel n'a pas été approuvée par un administrateur ou elle est déjà associée à un compte."
        );
        return;
      } else if (!responseCheckEmail.ok) {
        setIsLoading(false);
        setError(
          "Une erreur s'est produite lors de la validation du courriel. Veuillez réessayer ultérieurement."
        );
        return;
      }

      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      setIsLoading(false);
      if (!response.ok) {
        setError(
          "Une erreur s'est produite lors de l'envoi du courriel. Veuillez réessayer ultérieurement."
        );
        return;
      }

      onNext(email);
    } catch (e) {
      setIsLoading(false);
      setError(
        "Une erreur s'est produite lors de l'envoi du courriel. Veuillez réessayer ultérieurement."
      );
    }
  };

  return (
    <div>
      <h1 className="text-6xl font-semibold">Inscription</h1>
      <h2 className="mt-10">
        Veuillez entrer votre courriel institutionnel <br />
        afin de recevoir un code unique
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="email">Courriel</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleBlur}
            required
          />
          {error && (
            <p className="text-red-500 text-sm max-w-80 text-left">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
          disabled={!email || isLoading}
        >
          {isLoading ? "Envoi du code en cours..." : "Envoyer le code"}
        </Button>
      </form>

      <Button
        variant={"black"}
        type="button"
        onClick={onBack}
        className="mt-4 inline-block text-sm w-full"
      >
        Se connecter
      </Button>
    </div>
  );
}
