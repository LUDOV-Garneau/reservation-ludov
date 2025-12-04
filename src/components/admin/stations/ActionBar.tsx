"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddStationForm from "./AddStationForm";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSuccess: () => void;
  onAlert: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  isRefreshing: boolean;
}

export default function CardStationStats({
  searchQuery,
  onSearchChange,
  onRefresh,
  onSuccess,
  onAlert,
  isRefreshing,
}: ActionBarProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.stations.actionBar.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-gray-300"
        />
      </div>

      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="hover:bg-gray-100 flex-shrink-0"
                aria-busy={isRefreshing}
                aria-live="polite"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("admin.stations.actionBar.toolTipRefresh")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <AddStationForm
          onSuccess={() => {
            onAlert("success", t("admin.stations.actionBar.addStationSuccess"));
            onSuccess();
          }}
          onAlert={(type, message) =>
            onAlert(
              type as "success" | "destructive" | "info" | "warning",
              message
            )
          }
          trigger={
            <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition-colors flex-1">
              <Plus className="h-5 w-5" />
              <span className="hidden md:inline">
                {t("admin.stations.actionBar.addStation")}
              </span>
            </Button>
          }
        />
      </div>
    </div>
  );
}
