"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PolicyContentView from "./PolicyContentView";

type PolicyType = "privacy" | "usage";

const POLICY_TITLES: Record<PolicyType, string> = {
  privacy: "Politique de confidentialité",
  usage: "Politique d'utilisation",
};

interface PolitiquesClientProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Politique affichée dans le dialogue (confidentialité par défaut). */
  type?: PolicyType;
}

export default function PolitiquesClient({
  open,
  onOpenChange,
  type = "privacy",
}: PolitiquesClientProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-w-[calc(100vw-2rem)] max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4 bg-gray-50 shrink-0">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {POLICY_TITLES[type]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <PolicyContentView type={type} active={open} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
