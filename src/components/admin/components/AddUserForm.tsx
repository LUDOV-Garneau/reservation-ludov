"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

type Props = {
  onSuccess?: () => void;
};

export default function AddUserForm({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstname || !lastname || !email) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("L'adresse e-mail est invalide.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim().toLowerCase(),
          isAdmin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("existe déjà")) {
          toast.error("Un utilisateur avec cet e-mail existe déjà.");
        } else {
          toast.error(data.error || "Erreur lors de l'ajout de l'utilisateur.");
        }
        throw new Error(data.error);
      }

      toast.success("Utilisateur ajouté avec succès !");
      router.refresh();

      setFirstname("");
      setLastname("");
      setEmail("");
      setIsAdmin(false);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="mt-2">
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mt-4" noValidate>
          <div>
            <Label htmlFor="firstname">Prénom *</Label>
            <Input
              id="firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="lastname">Nom *</Label>
            <Input
              id="lastname"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(Boolean(checked))}
            />
            <Label htmlFor="isAdmin">Administrateur</Label>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Ajout en cours..." : "Ajouter l'utilisateur"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}