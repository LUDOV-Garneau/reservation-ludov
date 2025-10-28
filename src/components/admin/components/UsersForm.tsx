"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

type Props = {
  onSuccess?: () => void;
};

export default function UsersForm({ onSuccess }: Props) {
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

      if (!res.ok){ 
        toast.error("Impossible d'importer le fichier CSV : " + (await res.json()).error);
        throw new Error("Erreur lors de l'envoi du fichier");
      }

      toast.success("Fichier CSV importé avec succès !");
      setFile(null);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Veuillez sélectionner un fichier CSV.");
      return;
    }
    await uploadFile(file);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-4 items-center mt-4"
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
      >
        <Upload className="h-5 w-5" />
        Importer un fichier CSV
      </Button>
    </form>
  );
}
