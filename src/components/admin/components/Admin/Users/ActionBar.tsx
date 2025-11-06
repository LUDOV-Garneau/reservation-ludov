"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddUserForm from "@/components/admin/components/AddUserForm";
import UsersForm from "@/components/admin/components/UsersForm";
import { cn } from "@/lib/utils";

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

    return (
        <div className="flex gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher..."
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
                            <p>Actualiser</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-cyan-500 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg transition-all flex-1 sm:flex-initial">
                            <Plus className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Ajouter un utilisateur</span>
                            <span className="sm:hidden">Ajouter</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                        align="end" 
                        className="w-screen sm:w-[400px] md:w-[500px] max-w-[calc(100vw-2rem)] p-0"
                    >
                        <ScrollArea className="max-h-[calc(100vh-10rem)]">
                            <div className="p-4 space-y-6">
                                <div>
                                    <DropdownMenuLabel className="text-base font-semibold px-0 pb-2">
                                        Import CSV
                                    </DropdownMenuLabel>
                                    <p className="text-xs text-muted-foreground mb-3 px-0">
                                        Importez plusieurs utilisateurs à partir dun fichier CSV
                                    </p>
                                    <UsersForm 
                                        onSuccess={() => {
                                            onAlert("success", "Import CSV réussi");
                                            onSuccess();
                                            setDropdownOpen(false);
                                        }} 
                                        onAlert={(type, message) => onAlert(type as "success" | "error" | "info" | "warning", message)} 
                                    />
                                </div>

                                <DropdownMenuSeparator />

                                <div>
                                    <DropdownMenuLabel className="text-base font-semibold px-0 pb-2">
                                        Ajout Manuel
                                    </DropdownMenuLabel>
                                    <p className="text-xs text-muted-foreground mb-3 px-0">
                                        Créez un compte utilisateur individuellement
                                    </p>
                                    <AddUserForm 
                                        onSuccess={() => {
                                            onAlert("success", "Utilisateur ajouté");
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