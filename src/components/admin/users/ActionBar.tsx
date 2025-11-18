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
    type: "success" | "error" | "info" | "warning",
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
        {/* Barre de recherche */}
        <div className="relative w-full sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin.users.actionBar.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
          />
        </div>

        {/* Boutons actions */}
        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
          {/* Refresh */}
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

          {/* Add user (CSV / single) */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button className="flex-1 bg-cyan-500 text-white shadow-md transition-all hover:bg-cyan-700 hover:shadow-lg sm:flex-initial">
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
                  {/* Import CSV */}
                  <div>
                    <DropdownMenuLabel className="px-0 pb-2 text-base font-semibold">
                      {
                        t(
                          "admin.users.actionBar.dropDownMenuAddUser.importCSV"
                        )
                      }
                    </DropdownMenuLabel>
                    <p className="mb-3 px-0 text-xs text-muted-foreground">
                      {
                        t(
                          "admin.users.actionBar.dropDownMenuAddUser.importCSVDescription"
                        )
                      }
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
                          type as "success" | "error" | "info" | "warning",
                          message
                        )
                      }
                    />
                  </div>

                  <DropdownMenuSeparator />

                  {/* Add single user */}
                  <div>
                    <DropdownMenuLabel className="px-0 pb-2 text-base font-semibold">
                      {
                        t(
                          "admin.users.actionBar.dropDownMenuAddUser.addSingleUser"
                        )
                      }
                    </DropdownMenuLabel>
                    <p className="mb-3 px-0 text-xs text-muted-foreground">
                      {
                        t(
                          "admin.users.actionBar.dropDownMenuAddUser.addSingleUserDescription"
                        )
                      }
                    </p>
                    <AddUserForm
                        trigger={
                            <Button className="bg-cyan-500 text-white">
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
