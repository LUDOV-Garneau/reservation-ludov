"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

type Props = {
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
};

export default function UsersForm({ onSuccess, onAlert }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      uploadFile(selectedFile);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (fileToUpload: File) => {
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("/api/admin/add-users", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data) {
        onAlert?.(
          "error",
          "Impossible d'importer le fichier CSV."
        );
        return;
      }

      if (data.success) {
        onAlert?.(
          "success",
          `Importation terminée : ${data.inserted} utilisateur(s) ajouté(s), ${data.skipped} ignoré(s).`
        );
      } else {
        onAlert?.(
          "error",
            `Aucun utilisateur ajouté. ${data.skipped ?? 0} ignoré(s).`
        );
      }

      setFile(null);
      onSuccess?.();
      router.refresh();
    } catch {
      onAlert?.(
        "error",
        "Une erreur est survenue lors de l'importation du fichier."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      return;
    }
    await uploadFile(file);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 items-center"
    >
      <Input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="submit"
        onClick={handleButtonClick}
        className="flex items-center gap-2"
        variant="ghost"
      >
        <Upload className="h-5 w-5" />
        Importer un fichier CSV
      </Button>
    </form>
  );
}
