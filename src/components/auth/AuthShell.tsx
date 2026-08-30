"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import PolitiquesClient from "@/components/politiques/PolitiquesClient";

/**
 * Décor commun des écrans d'authentification : fond dégradé animé, barre
 * langue/aide, carte blanche et mention des conditions d'utilisation.
 *
 * Extrait de la page de connexion pour que la page de réinitialisation
 * (atteinte depuis le courriel) présente exactement la même chose sans en
 * dupliquer les cent lignes de décor.
 */
export default function AuthShell({
  children,
  progress = null,
}: {
  children: React.ReactNode;
  /** Avancement (0-100) de la barre en haut de la carte ; `null` la masque. */
  progress?: number | null;
}) {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-r from-cyan-50 via-cyan-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
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

      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between gap-2 bg-[white]/90 backdrop-blur-md py-3 px-5 rounded-2xl shadow-lg animate-fadeInUp border border-white/40">
          <LocaleSwitcher />
          <Link
            href="/docs?page=connexion&adminRessources=false"
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-cyan-50 transition-all group"
          >
            <HelpCircle className="w-4 h-4 text-gray-600 group-hover:text-cyan-500 transition-colors" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-cyan-500 transition-colors">
              Aide
            </span>
          </Link>
        </div>

        <div className="bg-[white]/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-[white]/20 relative overflow-hidden">
          <div
            className={`${
              progress === null && "hidden"
            } absolute top-0 left-0 right-0 h-1 bg-gray-200`}
          >
            <div
              className="h-full bg-cyan-500 transition-all duration-500 ease-out"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>

          {children}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-600"
        >
          En continuant, vous acceptez nos{" "}
          <button
            onClick={() => setPolicyOpen(true)}
            className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors font-medium"
          >
            Conditions d&apos;utilisation
          </button>
        </motion.p>
      </div>

      <PolitiquesClient open={policyOpen} onOpenChange={setPolicyOpen} />
    </div>
  );
}
