"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import SignupEmailForm from "@/components/auth/SignupEmailForm";
import SignupCodeForm from "@/components/auth/SignupCodeForm";
import SignupPasswordForm from "@/components/auth/SignupPasswordForm";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import Link from "next/link";

export default function AuthPage() {
  const [mode, setMode] = useState<
    "login" | "signup-step1" | "signup-step2" | "signup-step3"
  >("login");
  const [email, setEmail] = useState<string>("");
  const [direction, setDirection] = useState<number>(1);

  const handleModeChange = (newMode: typeof mode) => {
    const modes = ["login", "signup-step1", "signup-step2", "signup-step3"];
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>

      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between gap-2 bg-[white]/90 backdrop-blur-md py-3 px-5 rounded-2xl shadow-lg animate-fadeInUp border border-white/40">
          <LocaleSwitcher />
          <Link
            href="/docs/bibliotheques"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-cyan-50 transition-all group"
          >
            <HelpCircle className="w-4 h-4 text-gray-600 group-hover:text-cyan-600 transition-colors" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-cyan-600 transition-colors">
              Aide
            </span>
          </Link>
        </div>

        <div className="bg-[white]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-[white]/20 relative overflow-hidden">
          <div
            className={`${
              mode === "login" && "hidden"
            } absolute top-0 left-0 right-0 h-1 bg-gray-200`}
          >
            <div
              className="h-full bg-cyan-500 transition-all duration-500 ease-out"
              style={{
                width:
                  mode === "login"
                    ? "0%"
                    : mode === "signup-step1"
                    ? "33%"
                    : mode === "signup-step2"
                    ? "66%"
                    : "100%",
              }}
            />
          </div>

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
                <LoginForm onSignup={() => handleModeChange("signup-step1")} />
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
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-600"
        >
          En continuant, vous acceptez nos{" "}
          <Link
            href="/politiques"
            className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors font-medium"
          >
            Conditions d&apos;utilisation
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
