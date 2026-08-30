"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import SignupEmailForm from "@/components/auth/SignupEmailForm";
import SignupCodeForm from "@/components/auth/SignupCodeForm";
import SignupPasswordForm from "@/components/auth/SignupPasswordForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthShell from "@/components/auth/AuthShell";
import { Suspense } from "react";

type Mode =
  | "login"
  | "forgot-password"
  | "signup-step1"
  | "signup-step2"
  | "signup-step3";

/** Avancement de la barre de progression, par étape d'inscription. */
const PROGRESS: Partial<Record<Mode, number>> = {
  "signup-step1": 33,
  "signup-step2": 66,
  "signup-step3": 100,
};

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState<string>("");
  const [direction, setDirection] = useState<number>(1);

  const handleModeChange = (newMode: Mode) => {
    const modes: Mode[] = [
      "login",
      "forgot-password",
      "signup-step1",
      "signup-step2",
      "signup-step3",
    ];
    const currentIndex = modes.indexOf(mode);
    const newIndex = modes.indexOf(newMode);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setMode(newMode);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const transition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  };

  return (
    <Suspense>
      <AuthShell progress={PROGRESS[mode] ?? null}>
        <AnimatePresence mode="wait" custom={direction}>
          {mode === "login" && (
            <motion.div
              key="login"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <LoginForm
                onSignup={() => handleModeChange("signup-step1")}
                onForgotPassword={() => handleModeChange("forgot-password")}
              />
            </motion.div>
          )}

          {mode === "forgot-password" && (
            <motion.div
              key="forgot-password"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <ForgotPasswordForm onBack={() => handleModeChange("login")} />
            </motion.div>
          )}

          {mode === "signup-step1" && (
            <motion.div
              key="signup-step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <SignupEmailForm
                onNext={(email: string) => {
                  setEmail(email);
                  handleModeChange("signup-step2");
                }}
                onBack={() => handleModeChange("login")}
              />
            </motion.div>
          )}

          {mode === "signup-step2" && (
            <motion.div
              key="signup-step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <SignupCodeForm
                email={email}
                onNext={() => handleModeChange("signup-step3")}
                onBack={() => handleModeChange("signup-step1")}
              />
            </motion.div>
          )}

          {mode === "signup-step3" && (
            <motion.div
              key="signup-step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              <SignupPasswordForm
                email={email}
                onDone={() => handleModeChange("login")}
                onBack={() => handleModeChange("signup-step2")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AuthShell>
    </Suspense>
  );
}
