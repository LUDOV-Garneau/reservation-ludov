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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddUserForm from "@/components/admin/users/AddUserForm";
import UsersForm from "@/components/admin/users/AddUserCsv";
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

export default function CardUserStats({
  searchQuery,
  onSearchChange,
  onRefresh,
  onSuccess,
  onAlert,
  isRefreshing,
}: ActionBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const t = useTranslations();

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin.users.actionBar.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 border-gray-300"
          />
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
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
              <p>{t("admin.users.actionBar.toolTipRefresh")}</p>
            </TooltipContent>
          </Tooltip>

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 transition-colors text-white">
                <Plus className="h-4 w-4" />
                <span className="ml-1 hidden md:inline">
                  {t("admin.users.actionBar.addUser")}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-w-[calc(100vw-2rem)] w-full sm:w-[420px] md:w-[500px] p-0"
            >
              <ScrollArea className="max-h-[calc(100vh-10rem)]">
                <div className="space-y-6 p-4">
                  <div>
                    <DropdownMenuLabel className="px-0 pb-2 text-base font-semibold">
                      {t("admin.users.actionBar.dropDownMenuAddUser.importCSV")}
                    </DropdownMenuLabel>
                    <p className="mb-3 px-0 text-xs text-muted-foreground">
                      {t(
                        "admin.users.actionBar.dropDownMenuAddUser.importCSVDescription"
                      )}
                    </p>
                    <UsersForm
                      onSuccess={() => {
                        onAlert(
                          "success",
                          t(
                            "admin.users.actionBar.dropDownMenuAddUser.importCSVSuccess"
                          )
                        );
                        onSuccess();
                        setDropdownOpen(false);
                      }}
                      onAlert={(type, message) =>
                        onAlert(
                          type as
                            | "success"
                            | "destructive"
                            | "info"
                            | "warning",
                          message
                        )
                      }
                    />
                  </div>

                  <DropdownMenuSeparator />

                  <div>
                    <DropdownMenuLabel className="px-0 pb-2 text-base font-semibold">
                      {t(
                        "admin.users.actionBar.dropDownMenuAddUser.addSingleUser"
                      )}
                    </DropdownMenuLabel>
                    <p className="mb-3 px-0 text-xs text-muted-foreground">
                      {t(
                        "admin.users.actionBar.dropDownMenuAddUser.addSingleUserDescription"
                      )}
                    </p>
                    <AddUserForm
                      trigger={
                        <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 transition-colors text-white">
                          Ajouter un utilisateur
                        </Button>
                      }
                    />
                  </div>
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
