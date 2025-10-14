"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function UsersForm() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter(); 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Veuillez sélectionner un fichier CSV.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/add-user", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'envoi du fichier");

      toast.success("Fichier CSV importé avec succès !");
      setFile(null);

      router.refresh();
    } catch (error) {
      toast.error("Impossible d'importer le fichier CSV.");
      console.error(error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 items-center mt-4"
    >
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="max-w-sm"
      />
      <Button type="submit">Importer</Button>
    </form>
  );
}
