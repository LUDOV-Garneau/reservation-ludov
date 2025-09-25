"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "@/components/signup/LoginForm";
import SignupEmailForm from "@/components/signup/SignupEmailForm";
import SignupCodeForm from "@/components/signup/SignupCodeForm";
import SignupPasswordForm from "@/components/signup/SignupPasswordForm";

export default function AuthPage() {
  const [mode, setMode] = useState<
    "login" | "signup-step1" | "signup-step2" | "signup-step3"
  >("login");

  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div className="my-20 fixed inset-0 overflow-hidden">
      <div className="bg-[white] w-fit mx-auto md:px-40 sm:px-20 px-6 py-10 text-center flex flex-col justify-center rounded-4xl shadow-lg">
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              {...variants}
              transition={{ duration: 0.4 }}
            >
              <LoginForm onSignup={() => setMode("signup-step1")} />
            </motion.div>
          )}

          {mode === "signup-step1" && (
            <motion.div
              key="signup1"
              {...variants}
              transition={{ duration: 0.4 }}
            >
              <SignupEmailForm
                onNext={() => setMode("signup-step2")}
                onBack={() => setMode("login")}
              />
            </motion.div>
          )}

          {mode === "signup-step2" && (
            <motion.div
              key="signup2"
              {...variants}
              transition={{ duration: 0.4 }}
            >
              <SignupCodeForm
                onNext={() => setMode("signup-step3")}
                onBack={() => setMode("signup-step1")}
              />
            </motion.div>
          )}

          {mode === "signup-step3" && (
            <motion.div
              key="signup3"
              {...variants}
              transition={{ duration: 0.4 }}
            >
              <SignupPasswordForm
                onDone={() => setMode("login")}
                onBack={() => setMode("signup-step2")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
