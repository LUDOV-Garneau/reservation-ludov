"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();

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
          errorMsg = t("auth.emptyPassword");
        } else if (value.length < 6) {
          errorMsg = t("auth.createPassword.invalidPassword");
        }
        break;
      case "confirm-password":
        if (value != password) {
          errorMsg = t("auth.createPassword.invalidPasswordConfirmation");
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
        setGlobalError(t("auth.createPassword.errorAlreadySet"));
        return;
      }
      onDone();
    } catch {
      setIsLoading(false);
      setGlobalError(t("auth.createPassword.error"));
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 space-y-4 md:w-100"
      >
        <div className="flex flex-col gap-3">
          <Label htmlFor="password">{t("auth.createPassword.password")}</Label>
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
          <Label htmlFor="confirm-password">
            {t("auth.createPassword.confirmPassword")}
          </Label>
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
            ? t("auth.createPassword.finishBtnLoading")
            : t("auth.createPassword.finishBtn")}
        </Button>
      </form>

      <Button
        variant={"outline"}
        onClick={onBack}
        className="mt-4 inline-block text-sm w-full"
      >
        {t("auth.back")}
      </Button>
    </div>
  );
}
