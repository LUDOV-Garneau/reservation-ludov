"use client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function SignupCodeForm({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length != 6 || !/^\d+$/.test(code)) {
      setError("Ce code OTP est invalide.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/auth/otp?email=${encodeURIComponent(
          email
        )}&otp=${encodeURIComponent(code)}`
      );

      setIsLoading(false);
      if (!response.ok) {
        setError("Ce code OTP est invalide ou est expiré.");
        return;
      }

      onNext();
    } catch (e) {
      setIsLoading(false);
      setError("Une erreur s'est produite lors de la validation du code OTP.");
    }
  };

  return (
    <div>
      <h1 className="text-6xl font-semibold">Code unique</h1>
      <h2 className="mt-5">
        Veuillez entrer le code unique <br />
        qui vous a été envoyé par courriel
      </h2>

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
            {error && (
              <p className="text-red-500 text-sm max-w-80 text-left">{error}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
          disabled={code.length !== 6 || /[^0-9]/.test(code) || isLoading}
        >
          {isLoading ? "Vérification du code en cours..." : "Vérifier le code"}
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
  );
}
