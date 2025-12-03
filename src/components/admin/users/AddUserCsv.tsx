"use client";

import { useRef, useState } from "react";
import {
  Upload,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
  UserX,
  X,
} from "lucide-react";

type Props = {
  onSuccess?: () => void;
  onAlert?: (
    type: "success" | "destructive" | "info" | "warning",
    message: string
  ) => void;
};

type UploadStatus =
  | "idle"
  | "uploading"
  | "success"
  | "destructive"
  | "destructive"
  | "warning";

export default function UsersForm({ onSuccess, onAlert }: Props) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [stats, setStats] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (!selectedFile.name.endsWith(".csv")) {
        setStatus("destructive");
        setErrorMessage("Le fichier doit être au format CSV");
        return;
      }

      setFileName(selectedFile.name);
      await uploadFile(selectedFile);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (status !== "uploading") {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (status === "uploading") return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      if (!droppedFile.name.endsWith(".csv")) {
        setStatus("destructive");
        setErrorMessage("Le fichier doit être au format CSV");
        return;
      }

      setFileName(droppedFile.name);
      await uploadFile(droppedFile);
    }
  };

  const handleButtonClick = () => {
    if (status !== "uploading") {
      fileInputRef.current?.click();
    }
  };

  const uploadFile = async (fileToUpload: File) => {
    setStatus("uploading");
    setStats(null);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch("/api/admin/users/add-users", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data) {
        setStatus("destructive");
        setErrorMessage(data?.error || data?.message || "Échec de l'import");
        onAlert?.(
          "destructive",
          data?.error || data?.message || "Échec de l'import"
        );
        return;
      }

      if (data.success && data.inserted > 0) {
        setStatus("success");
        setStats({ inserted: data.inserted, skipped: data.skipped });
        onAlert?.(
          "success",
          `${data.inserted} utilisateur(s) ajouté(s), ${data.skipped} ignoré(s)`
        );
        onSuccess?.();
      } else {
        setStatus("warning");
        setErrorMessage(
          data.message ||
            `Aucun utilisateur ajouté. ${data.skipped || 0} ignoré(s)`
        );
        onAlert?.("warning", data.message || `Aucun utilisateur ajouté`);
      }
    } catch (error) {
      setStatus("destructive");
      setErrorMessage("Erreur lors de l'upload du fichier");
      onAlert?.("destructive", "Erreur lors de l'upload du fichier");
    }
  };

  const resetStatus = () => {
    setStatus("idle");
    setFileName("");
    setStats(null);
    setErrorMessage("");
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={status !== "uploading" ? handleButtonClick : undefined}
        className={`
          relative border-2 border-dashed rounded-lg transition-all w-full
          ${
            status === "uploading"
              ? "border-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/20 cursor-not-allowed p-4"
              : isDragging
              ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 cursor-pointer p-4"
              : "border-gray-300 dark:border-gray-700 hover:border-cyan-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer p-4"
          }
        `}
      >
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={status === "uploading"}
        />

        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex items-center gap-3">
            <div
              className={`
              p-2.5 rounded-lg transition-all flex-shrink-0
              ${
                isDragging
                  ? "bg-cyan-100 dark:bg-cyan-900/50"
                  : status === "uploading"
                  ? "bg-cyan-100 dark:bg-cyan-900/50"
                  : "bg-gray-100 dark:bg-gray-800"
              }
            `}
            >
              {status === "uploading" ? (
                <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
              ) : (
                <Upload
                  className={`w-5 h-5 ${
                    isDragging ? "text-cyan-600" : "text-gray-400"
                  }`}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {status === "uploading" ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Import en cours...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {fileName}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {isDragging ? "Déposez le fichier" : "Fichier CSV"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Cliquez pour parcourir
                  </p>
                </div>
              )}
            </div>
          </div>

          {status === "idle" && !isDragging && (
            <button
              type="button"
              className="w-full px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Sélectionner un fichier
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div
            className={`
            p-2.5 rounded-lg transition-all flex-shrink-0
            ${
              isDragging
                ? "bg-cyan-100 dark:bg-cyan-900/50"
                : status === "uploading"
                ? "bg-cyan-100 dark:bg-cyan-900/50"
                : "bg-gray-100 dark:bg-gray-800"
            }
          `}
          >
            {status === "uploading" ? (
              <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />
            ) : (
              <Upload
                className={`w-5 h-5 ${
                  isDragging ? "text-cyan-600" : "text-gray-400"
                }`}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {status === "uploading" ? (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Import en cours...
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {fileName}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isDragging ? "Déposez le fichier" : "Glissez un fichier CSV"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  ou cliquez pour parcourir
                </p>
              </div>
            )}
          </div>

          {status === "idle" && !isDragging && (
            <button
              type="button"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white text-sm font-medium rounded-full transition-colors flex-shrink-0"
            >
              Parcourir
            </button>
          )}
        </div>

        {status === "uploading" && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"
                style={{
                  width: "70%",
                  animation: "progress 1.5s ease-in-out infinite",
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {status === "success" && stats && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3 w-full">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                Import réussi !
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <FileSpreadsheet className="w-3 h-3 text-green-700 dark:text-green-300 flex-shrink-0" />
                <span className="text-xs text-green-700 dark:text-green-300 truncate">
                  {fileName}
                </span>
              </div>
            </div>
            <button
              onClick={resetStatus}
              className="p-1.5 hover:bg-green-200 dark:hover:bg-green-900/50 rounded transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-green-700 dark:text-green-300" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-md flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {stats.inserted}
                  </p>
                  <p className="text-[10px] text-green-700 dark:text-green-300 font-medium">
                    Ajoutés
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-md flex-shrink-0">
                  <UserX className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    {stats.skipped}
                  </p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                    Ignorés
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "destructive" && (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 w-full">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg flex-shrink-0">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                Échec de l&apos;import
              </h4>
              {fileName && (
                <div className="flex items-center gap-2 mt-1">
                  <FileSpreadsheet className="w-3 h-3 text-red-700 dark:text-red-300 flex-shrink-0" />
                  <span className="text-xs text-red-700 dark:text-red-300 truncate">
                    {fileName}
                  </span>
                </div>
              )}
              {errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 break-words">
                  {errorMessage}
                </p>
              )}
            </div>
            <button
              onClick={resetStatus}
              className="p-1.5 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Fermer"
            >
              <X className="w-4 h-4 text-red-700 dark:text-red-300" />
            </button>
          </div>
        </div>
      )}

      {status === "idle" && (
        <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3 w-full">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-cyan-900 dark:text-cyan-100 mb-1">
                Format CSV requis :
              </p>
              <ul className="space-y-1 text-[11px] text-cyan-700 dark:text-cyan-300">
                <li className="break-words">
                  • Username, Date Created, Last Login, First Name, Last Name
                </li>
                <li>• Encodage UTF-8, max 5 MB</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
