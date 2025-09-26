"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function SignupPasswordForm({
  email,
  onDone,
  onBack,
}: {
  email: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "password":
        if (value === "") {
          errorMsg = "Veuillez entrer un mot de passe.";
        } else if (value.length < 6) {
          errorMsg = "Le mot de passe doit contenir au moins 6 caractères.";
        }
        break;
      case "confirm-password":
        if (value != password) {
          errorMsg =
            "La confirmation de mot de passe doit être identique au mot de passe.";
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    return errorMsg;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const newErrors = {
      password: validateField("password", password),
      confirmPassword: validateField("confirm-password", confirmPassword),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });
      setIsLoading(false);
      if (!response.ok) {
        setGlobalError("Cet utilisateur a déjà un mot de passe.");
        return;
      }
      onDone();
    } catch (e) {
      setIsLoading(false);
      setGlobalError(
        "Une erreur s'est produite lors de la création de votre mot de passe. Veuillez réessayer ultérieurement."
      );
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="password">Définir un mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={handleBlur}
            required
          />
          {errors.password && (
            <p className="text-red-500 text-sm max-w-80 text-left">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="confirm-password">Confirmer votre mot de passe</Label>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={handleBlur}
            required
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm max-w-80 text-left">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {globalError != null && (
          <p className="text-red-500 text-sm max-w-80 text-left">
            {globalError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
          disabled={!password || !confirmPassword || isLoading}
        >
          {isLoading
            ? "Enregistrement du mot de passe en cours..."
            : "Terminer"}
        </Button>
      </form>

      <Button
        variant={"black"}
        onClick={onBack}
        className="mt-4 inline-block text-sm w-full"
      >
        Retour
      </Button>
    </div>
  );
}
