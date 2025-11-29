import { Suspense } from "react";
import AuthClient from "@/components/auth/AuthClient";

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <AuthClient />
    </Suspense>
  );
}
