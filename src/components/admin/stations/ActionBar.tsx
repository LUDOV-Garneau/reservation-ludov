"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddStationForm from "@/components/admin/stations/AddStationForm";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSuccess: () => void;
  onAlert: (
    type: "success" | "error" | "info" | "warning",
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
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const t = useTranslations();

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.stations.actionBar.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 w-full"
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

        {/* <AddStationForm
          onSuccess={() => {
            onAlert(
              "success",
              t(
                "admin.station.actionBar.addStationSuccess"
              )
            );
            onSuccess();
          }}
          onAlert={(type, message) =>
            onAlert(type as "success" | "error" | "info" | "warning", message)
          }
          trigger={ */}
            <Button className="bg-cyan-500 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">
                {t("admin.stations.actionBar.addStation")}
              </span>
            </Button>
          {/* }
        /> */}
      </div>
    </div>
  );
}
