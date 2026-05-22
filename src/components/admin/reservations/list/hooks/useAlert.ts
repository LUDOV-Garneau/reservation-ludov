import { useState, useCallback } from "react";

export type AlertType = "success" | "destructive" | "info" | "warning";

export type AlertState = {
  type: AlertType;
  message: string;
  title?: string;
} | null;

export function useAlert() {
  const [alert, setAlert] = useState<AlertState>(null);

  const showAlert = useCallback(
    (type: AlertType, message: string, title?: string) => {
      setAlert({ type, message, title });
    },
    []
  );

  const clearAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, clearAlert };
}
