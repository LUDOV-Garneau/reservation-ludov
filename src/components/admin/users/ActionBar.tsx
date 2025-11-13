"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddUserForm from "@/components/admin/users/AddUserForm";
import UsersForm from "@/components/admin/users/UsersForm";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ActionBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    onSuccess: () => void;
    onAlert: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
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
        <div className="flex gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("admin.users.actionBar.searchPlaceholder")}
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
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("admin.users.actionBar.toolTipRefresh")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-cyan-500 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial">
                            <Plus className="h-4 w-4" />
                            <span className="hidden md:inline">{t("admin.users.actionBar.addUser")}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-screen sm:w-[400px] md:w-[500px] max-w-[calc(100vw-2rem)] p-0"
                    >
                        <ScrollArea className="max-h-[calc(100vh-10rem)]">
                            <div className="p-4 space-y-6">
                                <div>
                                    <DropdownMenuLabel className="text-base font-semibold px-0 pb-2">{t("admin.users.actionBar.dropDownMenuAddUser.importCSV")}</DropdownMenuLabel>
                                    <p className="text-xs text-muted-foreground mb-3 px-0">
                                        {t("admin.users.actionBar.dropDownMenuAddUser.importCSVDescription")}
                                    </p>
                                    <UsersForm 
                                        onSuccess={() => {
                                            onAlert("success", t("admin.users.actionBar.dropDownMenuAddUser.importCSVSuccess"));
                                            onSuccess();
                                            setDropdownOpen(false);
                                        }} 
                                        onAlert={(type, message) => onAlert(type as "success" | "error" | "info" | "warning", message)} 
                                    />
                                </div>

                                <DropdownMenuSeparator />

                                <div>
                                    <DropdownMenuLabel className="text-base font-semibold px-0 pb-2">
                                        {t("admin.users.actionBar.dropDownMenuAddUser.addSingleUser")}
                                    </DropdownMenuLabel>
                                    <p className="text-xs text-muted-foreground mb-3 px-0">
                                        {t("admin.users.actionBar.dropDownMenuAddUser.addSingleUserDescription")}
                                    </p>
                                    <AddUserForm 
                                        onSuccess={() => {
                                            onAlert("success", t("admin.users.actionBar.dropDownMenuAddUser.addSingleUserSuccess"));
                                            onSuccess();
                                            setDropdownOpen(false);
                                        }} 
                                        onAlert={(type, message) => onAlert(type as "success" | "error" | "info" | "warning", message)} 
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}