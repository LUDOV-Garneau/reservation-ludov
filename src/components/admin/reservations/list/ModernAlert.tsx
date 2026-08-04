"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react";
import type { AlertState } from "./hooks/useAlert";

const ALERT_ICONS: Record<NonNullable<AlertState>["type"], React.ReactNode> = {
  success: <CheckCircle2 className="h-8 w-8 lg:h-6 lg:w-6 text-green-600" />,
  destructive: <AlertCircle className="h-8 w-8 lg:h-6 lg:w-6 text-red-600" />,
  warning: <AlertTriangle className="h-8 w-8 lg:h-6 lg:w-6 text-yellow-600" />,
  info: <Info className="h-8 w-8 lg:h-6 lg:w-6 text-blue-600" />,
};

export function ModernAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  if (!alert) return null;

  return (
    <Alert
      className="mb-4"
      variant={
        alert.type === "success"
          ? "success"
          : alert.type === "destructive"
            ? "destructive"
            : "default"
      }
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2">
          {ALERT_ICONS[alert.type]}
          <div>
            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
            <AlertDescription>{alert.message}</AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 p-0 ml-auto"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
