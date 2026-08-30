"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CSV_MAX_BYTES } from "@/lib/userValidation";
import { ADD_USER_PANE_MIN_H } from "./types";

type Props = {
  onSuccess?: () => void;
  onAlert?: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
  ) => void;
};

type UploadStatus = "idle" | "uploading" | "success" | "destructive" | "warning";

const MAX_MB = Math.round(CSV_MAX_BYTES / (1024 * 1024));

/** Noms exacts attendus par `POST /api/admin/users/add-users`. */
const REQUIRED_COLUMNS = [
  "Username",
  "Date Created",
  "Last Login",
  "First Name",
  "Last Name",
];

export default function AddUserCsv({ onSuccess, onAlert }: Props) {
  const t = useTranslations("admin.users.csvImport");

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState("");
  const [stats, setStats] = useState<{ inserted: number; skipped: number } | null>(null);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = status === "uploading";

  const fail = (text: string) => {
    setStatus("destructive");
    setMessage(text);
    onAlert?.("destructive", text);
  };

  /** Contrôles communs au clic et au glisser-déposer. */
  const accept = async (file: File) => {
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      fail(t("errors.notCsv"));
      return;
    }
    // La même limite est appliquée par la route ; la vérifier ici évite
    // d'envoyer inutilement plusieurs mégaoctets pour se faire refuser.
    if (file.size > CSV_MAX_BYTES) {
      fail(t("errors.tooLarge", { max: MAX_MB }));
      return;
    }
    await uploadFile(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await accept(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) await accept(file);
  };

  const uploadFile = async (fileToUpload: File) => {
    setStatus("uploading");
    setStats(null);
    setMessage("");

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("/api/admin/users/add-users", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        fail(data?.error || data?.message || t("errors.failed"));
        return;
      }

      if (data.success && data.inserted > 0) {
        setStatus("success");
        setStats({ inserted: data.inserted, skipped: data.skipped ?? 0 });
        onAlert?.(
          "success",
          t("result.summary", { inserted: data.inserted, skipped: data.skipped ?? 0 }),
        );
        onSuccess?.();
      } else {
        setStatus("warning");
        const text = data.message || t("result.noneAdded", { skipped: data.skipped ?? 0 });
        setMessage(text);
        onAlert?.("warning", text);
      }
    } catch {
      fail(t("errors.upload"));
    }
  };

  const reset = () => {
    setStatus("idle");
    setFileName("");
    setStats(null);
    setMessage("");
  };

  // Écran de résultat : même gabarit que la confirmation du formulaire manuel,
  // pour que le dialogue ne change pas de taille selon ce qui s'affiche.
  if (status === "success" && stats) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 text-center",
          ADD_USER_PANE_MIN_H,
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div>
          <p className="font-medium">{t("result.title")}</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[16rem] truncate">{fileName}</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.inserted}
            </p>
            <p className="text-xs text-muted-foreground">{t("result.added")}</p>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden />
          <div>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                stats.skipped > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
              )}
            >
              {stats.skipped}
            </p>
            <p className="text-xs text-muted-foreground">{t("result.skipped")}</p>
          </div>
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {t("result.noAccessYet")}
        </p>

        <Button variant="outline" size="sm" onClick={reset}>
          {t("importAnother")}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", ADD_USER_PANE_MIN_H)}>
      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
          "focus-visible:ring-[3px] focus-visible:ring-cyan-500/20 focus-visible:outline-none",
          isUploading && "cursor-wait border-cyan-300 bg-cyan-50/40 dark:bg-cyan-950/20",
          !isUploading && isDragging && "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30",
          !isUploading && !isDragging && "border-input hover:border-cyan-500 hover:bg-muted/40",
        )}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            isDragging || isUploading ? "bg-cyan-100 dark:bg-cyan-900/50" : "bg-muted",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          ) : (
            <Upload
              className={cn(
                "h-5 w-5",
                isDragging ? "text-cyan-600" : "text-muted-foreground",
              )}
            />
          )}
        </div>

        <div>
          <p className="text-sm font-medium" aria-live="polite">
            {isUploading ? t("uploading") : isDragging ? t("dropHere") : t("dragOrBrowse")}
          </p>
          <p className="mt-1 max-w-[18rem] truncate text-xs text-muted-foreground">
            {isUploading && fileName ? fileName : t("clickToBrowse")}
          </p>
        </div>
      </button>

      {(status === "destructive" || status === "warning") && (
        <div
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
            status === "destructive"
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
          )}
          role="alert"
        >
          {status === "destructive" ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            {fileName && <p className="truncate text-xs opacity-80">{fileName}</p>}
            <p className="break-words">{message}</p>
          </div>
        </div>
      )}

      {/* Les noms de colonnes sont donnés en monospace : ils doivent être
          recopiés à l'identique dans le fichier, une phrase les noierait. */}
      <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
        <p className="text-xs font-medium">{t("format.title")}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {REQUIRED_COLUMNS.map((column) => (
            <code
              key={column}
              className="rounded border bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
            >
              {column}
            </code>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("format.encoding", { max: MAX_MB })}
        </p>
      </div>
    </div>
  );
}
