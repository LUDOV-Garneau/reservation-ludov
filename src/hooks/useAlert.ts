import { useCallback } from "react";
import { toast } from "sonner";

export type AlertType = "success" | "destructive" | "info" | "warning";

/**
 * Rétroactions de l'admin : un toast (sonner) plutôt qu'une bannière dans la
 * page. Le <Toaster> est monté dans app/[locale]/layout.tsx.
 */
export function useAlert() {
  const showAlert = useCallback(
    (type: AlertType, message: string, title?: string) => {
      const text = title ?? message;
      const options = title ? { description: message } : undefined;

      if (type === "success") toast.success(text, options);
      else if (type === "destructive") toast.error(text, options);
      else if (type === "warning") toast.warning(text, options);
      else toast.info(text, options);
    },
    []
  );

  return { showAlert };
}
