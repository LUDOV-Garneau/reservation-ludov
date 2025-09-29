"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";

export default function LoginForm({ onSignup }: { onSignup: () => void }) {
  const locale = useLocale();
  const t = useTranslations();

  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateField = (name: string, value: string) => {
    let errorMsg = "";

    switch (name) {
      case "email":
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          errorMsg = t("auth.invalidEmail");
        }
        break;
      case "password":
        if (value === "") {
          errorMsg = t("auth.emptyPassword");
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
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login.login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: "include",
      });
      setIsLoading(false);
      if (response.status === 401) {
        setGlobalError(t("auth.login.invalidCredentials"));
        return;
      } else if (!response.ok) {
        setGlobalError(t("auth.login.error"));
        return;
      }
      window.location.assign(`/${locale}`);
    } catch {
      setIsLoading(false);
      setGlobalError(t("auth.login.error"));
    }
  };

  return (
    <div>
      <h1 className="text-6xl font-semibold">{t("auth.login.title")}</h1>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-10 space-y-4 md:w-100"
      >
        <div className="flex flex-col gap-3">
          <Label htmlFor="email">{t("auth.email")}</Label>
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
            <p className="text-red-500 text-sm max-w-80 text-left">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Label htmlFor="password">{t("auth.login.password")}</Label>
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
            <p className="text-red-500 text-sm max-w-80 text-left">
              {errors.password}
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
          disabled={!formData.email || !formData.password || isLoading}
          className="w-full bg-cyan-300 hover:bg-cyan-500 disabled:bg-cyan-900"
        >
          {isLoading
            ? t("auth.login.loginBtnLoading")
            : t("auth.login.loginBtn")}
        </Button>
      </form>

      <Button
        variant={"black"}
        type="button"
        onClick={onSignup}
        className="mt-4 inline-block text-sm w-full"
      >
        {t("auth.login.newUser")}
      </Button>
    </div>
  );
}
