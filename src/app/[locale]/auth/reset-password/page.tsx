"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  return <ResetPasswordForm token={searchParams.get("token")} />;
}

/**
 * Écran atteint depuis le lien du courriel de réinitialisation.
 *
 * Page distincte de `/auth` : le jeton n'a rien à faire dans l'URL de la page
 * de connexion ordinaire, où il traînerait dans l'historique du navigateur.
 */
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense>
        <ResetPasswordContent />
      </Suspense>
    </AuthShell>
  );
}
