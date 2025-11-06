"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, KeyRound, Users, ChevronLeft, ChevronRight, Shield, User, Calendar, XCircle, Menu, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import CardUserStats from "./Admin/Users/CardStats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ActionBar from "./Admin/Users/ActionBar";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
};

type AlertState = {
  type: "success" | "error" | "info" | "warning";
  message: string;
  title?: string;
} | null;

type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant: "default" | "destructive";
  onConfirm: () => void;
} | null;

const ITEMS_PER_PAGE = 10;

function getCurrentUserIdFromCookie(): number | null {
  if (typeof document === "undefined") return null;
  
  const cookies = document.cookie.split(";");
  const sessionCookie = cookies.find((c) => c.trim().startsWith("SESSION="));
  
  if (!sessionCookie) return null;
  
  try {
    const token = sessionCookie.split("=")[1];
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id ? Number(payload.id) : null;
  } catch {
    return null;
  }
}

function usePagination(totalItems: number, itemsPerPage: number = ITEMS_PER_PAGE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const goToNextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((pageNum: number) => {
    setPage(Math.max(1, Math.min(pageNum, totalPages)));
  }, [totalPages]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    totalPages,
    itemsPerPage,
    goToNextPage,
    goToPrevPage,
    goToPage,
    resetPage,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}

/**
 * Badge de rôle utilisateur
 */
function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  return isAdmin ? (
    <Badge className="bg-cyan-700 text-white border-0 text-xs">
      <Shield className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">Admin</span>
      <span className="sm:hidden">A</span>
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
      <User className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">User</span>
      <span className="sm:hidden">U</span>
    </Badge>
  );
}

/**
 * Ligne de tableau utilisateur - Responsive
 */
function UserTableRow({
  user,
  isCurrentUser,
  onDelete,
  onResetPassword,
}: {
  user: User;
  isCurrentUser: boolean;
  onDelete: (userId: number, email: string) => void;
  onResetPassword: (userId: number, email: string) => void;
}) {
  return (
    <TableRow key={user.id} className="hover:bg-gray-200">
      <TableCell>{user.email}</TableCell>

      <TableCell>{user.firstName}</TableCell>

      <TableCell className="hidden md:table-cell">{user.lastName}</TableCell>

      <TableCell><RoleBadge isAdmin={user.isAdmin} /></TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </TableCell>

      <TableCell>
        {!isCurrentUser ? (
          <div className="">
            {/* Version Desktop - Boutons séparés */}
            <div className="hidden sm:flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResetPassword(user.id, user.email)}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors h-8 w-8 p-0"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Réinitialiser MDP</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(user.id, user.email)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Version Mobile - Menu Dropdown */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onResetPassword(user.id, user.email)}>
                    <KeyRound className="h-4 w-4 mr-2 text-blue-500" />
                    Réinitialiser MDP
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(user.id, user.email)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <span className="text-xs sm:text-sm text-muted-foreground px-2">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * Contrôles de pagination - Responsive
 */
function PaginationControls({
  page,
  totalPages,
  totalItems,
  itemsPerPage,
  isFirstPage,
  isLastPage,
  onPrevious,
  onNext,
  onGoToPage,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}) {
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 2) {
        for (let i = 1; i <= Math.min(3, totalPages); i++) pages.push(i);
        if (totalPages > 3) {
          pages.push(-1);
          pages.push(totalPages);
        }
      } else if (page >= totalPages - 1) {
        pages.push(1);
        pages.push(-1);
        for (let i = Math.max(totalPages - 2, 2); i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(page);
        pages.push(-1);
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-4 border-t">
      <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
        <span className="hidden sm:inline">
          Affichage de <span className="font-medium text-gray-900">{startItem}</span> à{" "}
          <span className="font-medium text-gray-900">{endItem}</span> sur{" "}
          <span className="font-medium text-gray-900">{totalItems}</span> utilisateurs
        </span>
        <span className="sm:hidden">
          {startItem}-{endItem} sur {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={isFirstPage}
          className="h-8 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((pageNum, idx) =>
            pageNum === -1 ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0",
                  page === pageNum
                    ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md"
                    : "hover:bg-gray-100"
                )}
                onClick={() => onGoToPage(pageNum)}
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        {/* Indicateur de page pour mobile */}
        <div className="sm:hidden px-3 py-1 bg-gray-100 rounded text-sm font-medium">
          {page}/{totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={isLastPage}
          className="h-8 hover:bg-gray-100"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  confirmVariant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 sm:mt-6 flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="hover:bg-gray-100 w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            className={cn(
              "w-full sm:w-auto",
              confirmVariant === "destructive" &&
                "bg-red-600 hover:bg-red-700 shadow-md"
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModernAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  if (!alert) return null;

  const icon =
    alert.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
    alert.type === "error"   ? <XCircle className="h-4 w-4 text-red-600" /> :
    alert.type === "warning" ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
                               <Info className="h-4 w-4 text-blue-600" />;

  return (
    <Alert
      className="mb-4"
      variant={
        alert.type === "success" ? "default" :
        alert.type === "error"   ? "destructive" :
        "default"
      }
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex gap-2">
          {icon}
          <div>
            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
            <AlertDescription>{alert.message}</AlertDescription>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 p-0">
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

function useAlert() {
  const [alert, setAlert] = useState<AlertState>(null);

  const showAlert = useCallback(
    (
      type: "success" | "error" | "info" | "warning",
      message: string,
      title?: string
    ) => {
      setAlert({ type, message, title });
    },
    []
  );

  const clearAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, clearAlert };
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-24 hidden lg:block" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UsersTable() {
  const t = useTranslations();
  const { alert, showAlert, clearAlert } = useAlert();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);

  const [totalUser, setTotalUser] = useState(0);
  const [totalUserNotBoarded, setTotalUserNotBoarded] = useState(0);
  const [totalUserWithReservation, setTotalUserWithReservation] = useState(0);

  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const pagination = usePagination(total, ITEMS_PER_PAGE);

  useEffect(() => {
    const userId = getCurrentUserIdFromCookie();
    setCurrentUserId(userId);

    if (userId === null) {
      console.warn("Unable to retrieve current user ID from cookies");
    }

    fetchMetrics();
    fetchUsers(pagination.page, ITEMS_PER_PAGE);
  }, [pagination.page]);

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery]);

  async function fetchMetrics() {
    try {
      setMetricsLoading(true);
      const res = await fetch("/api/admin/users/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const data = await res.json();
      setTotalUser(data.totalUser);
      setTotalUserNotBoarded(data.totalUserNotBoarded);
      setTotalUserWithReservation(data.totalUserWithReservation);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setMetricsLoading(false);
    }
  }

  async function fetchUsers(page = 1, limit = ITEMS_PER_PAGE) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur API utilisateurs");
      }

      const data = await res.json();
      const rows = data.rows ?? data.users ?? [];
      const totalCount = Number(data.total ?? 0);

      setUsers(rows);
      setTotal(totalCount);
    } catch (error) {
      console.error(error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search)
    );
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMetrics(),
      fetchUsers(pagination.page, pagination.itemsPerPage),
    ]);
    setIsRefreshing(false);
  }, [pagination.page, pagination.itemsPerPage]);

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("admin.users.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Gérez les comptes utilisateurs et permissions
        </p>
      </div>

      <CardUserStats
        loading={metricsLoading}
        totalUser={totalUser ?? 0}
        totalUserNotBoarded={totalUserNotBoarded ?? 0}
        totalUserWithReservation={totalUserWithReservation ?? 0}
      />

      <ModernAlert alert={alert} onClose={clearAlert} />

      <Card className="shadow-md border-gray-200">
        <CardHeader className="pb-3 sm:pb-4 border-b p-4 sm:p-6">
          <ActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={handleRefresh}
            onSuccess={handleRefresh}
            onAlert={showAlert}
            isRefreshing={isRefreshing}
          />
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6">
              <TableSkeleton />
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead className="hidden md:table-cell">Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="hidden lg:table-cell">Date de création</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        isCurrentUser={currentUserId !== null && user.id === currentUserId}
                        onDelete={() => console.log("Delete user", user.id)}
                        onResetPassword={() => console.log("Reset password", user.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {total > ITEMS_PER_PAGE && (
                <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                  <PaginationControls
                    page={pagination.page}
                    totalPages={Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))}
                    totalItems={total}
                    itemsPerPage={ITEMS_PER_PAGE}
                    isFirstPage={pagination.isFirstPage}
                    isLastPage={pagination.isLastPage}
                    onPrevious={pagination.goToPrevPage}
                    onNext={pagination.goToNextPage}
                    onGoToPage={pagination.goToPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Commencez par ajouter votre premier utilisateur."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          confirmVariant={confirmDialog.confirmVariant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}