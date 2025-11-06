"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  onSuccess?: () => void;
  onAlert?: (type: "success" | "error", message: string) => void;
};

export default function UsersForm({ onSuccess, onAlert }: Props) {
  const t = useTranslations();
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
        onAlert?.("error", t("admin.users.usersForm.error.importFailed"));
        return;
      }

      if (data.success) {
        onAlert?.(
          "success",
          t("admin.users.usersForm.success.importComplete", {
            inserted: data.inserted,
            skipped: data.skipped,
          })
        );
      } else {
        onAlert?.(
          "error",
          t("admin.users.usersForm.error.noUsersAdded", {
            skipped: data.skipped ?? 0,
          })
        );
      }

      setFile(null);
      onSuccess?.();
      router.refresh();
    } catch {
      onAlert?.("error", t("admin.users.usersForm.error.uploadException"));
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
        {t("admin.users.usersForm.button.importCsv")}
      </Button>
    </form>
  );
}
