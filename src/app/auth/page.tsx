"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import LoginForm from "@/components/signup/LoginForm"
import SignupEmailForm from "@/components/signup/SignupEmailForm"
import SignupCodeForm from "@/components/signup/SignupCodeForm"
import SignupPasswordForm from "@/components/signup/SignupPasswordForm"

export default function AuthPage() {
  const [mode, setMode] = useState<
    "login" | "signup-step1" | "signup-step2" | "signup-step3"
  >("login")

  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <div className="min-h-screen">
      <div className="container-page">
        <div className="bg-background p-5 md:p-10 md:mx-20 text-center md:py-20 py-10 h-full min-h-screen flex flex-col justify-center md:gap-24">
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div key="login" {...variants} transition={{ duration: 0.4 }}>
                <LoginForm onSignup={() => setMode("signup-step1")} />
              </motion.div>
            )}

            {mode === "signup-step1" && (
              <motion.div key="signup1" {...variants} transition={{ duration: 0.4 }}>
                <SignupEmailForm
                  onNext={() => setMode("signup-step2")}
                  onBack={() => setMode("login")}
                />
              </motion.div>
            )}

            {mode === "signup-step2" && (
              <motion.div key="signup2" {...variants} transition={{ duration: 0.4 }}>
                <SignupCodeForm
                  onNext={() => setMode("signup-step3")}
                  onBack={() => setMode("signup-step1")}
                />
              </motion.div>
            )}

            {mode === "signup-step3" && (
              <motion.div key="signup3" {...variants} transition={{ duration: 0.4 }}>
                <SignupPasswordForm
                  onDone={() => setMode("login")}
                  onBack={() => setMode("signup-step2")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
