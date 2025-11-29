"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  trigger: React.ReactNode;
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
};

export default function AddCoursForm({ trigger, onSuccess, onAlert }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setCode("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      setError("Tous les champs sont requis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/add-cours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
        }),
      });

      if (res.status === 409) {
        setError("Un cours avec ce nom ou ce code existe déjà.");
        return;
      }

      if (res.status === 400) {
        const data = await res.json();
        if (data.error?.includes("7 caractères")) {
          setError("Le code du cours ne peut pas dépasser 7 caractères.");
        } else {
          setError(data.error || "Tous les champs doivent être remplis.");
        }
        return;
      }

      if (!res.ok) throw new Error("Erreur API");

      onAlert?.("success", "Cours ajouté avec succès.");
      router.refresh();
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      onAlert?.("error", "Erreur lors de l’ajout du cours.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-[500px] w-full p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-5 border-b">
          <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            Ajouter un cours
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Nom du cours <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: Programmation Web"
                className="h-12 text-base border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Code du cours <span className="text-red-500">*</span>
              </Label>
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: INF101"
                className="h-12 text-base border-2"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="px-6 py-4 border-t">
            <Button
              type="submit"
              disabled={loading || !name.trim() || !code.trim()}
              className="w-full h-12 text-base font-semibold bg-cyan-500 hover:bg-cyan-700"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Ajouter le cours
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}