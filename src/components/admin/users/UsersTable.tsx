"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, KeyRound, Users, Shield, User, Calendar, XCircle, Menu, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import CardUserStats from "./CardStats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ActionBar from "./ActionBar";
import PaginationControls from "./Pagination";
import ResetPasswordAction from "./DialogConfirmationResetsPassword";
import DeleteUserAction from "./DialogConfirmationDeleteUser";
import { useRouter } from "next/navigation";

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

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations();
  return isAdmin ? (
    <Badge className="bg-cyan-700 text-white border-0 text-xs">
      <Shield className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">{t("admin.users.badge.admin")}</span>
      <span className="sm:hidden">A</span>
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
      <User className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">{t("admin.users.badge.user")}</span>
      <span className="sm:hidden">U</span>
    </Badge>
  );
}

function UserTableRow({
  user,
  isCurrentUser,
  onAlert,
  onSuccess,
  onRowClick,
}: {
  user: User;
  isCurrentUser: boolean;
  onAlert: (type: "success" | "error" | "info" | "warning", message: string, title?: string) => void;
  onSuccess: () => void;
  onRowClick: (user: User) => void;
}) {
  const t = useTranslations();
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/admin/user/${user.id}`);
  }

  return (
    <TableRow
      key={user.id}
      className="hover:bg-gray-100 cursor-pointer"
      onClick={handleRowClick}
    >
      <TableCell className="hidden lg:table-cell">{user.email}</TableCell>
      <TableCell>{user.firstName} {user.lastName}</TableCell>
      <TableCell className="hidden md:table-cell">
        <RoleBadge isAdmin={user.isAdmin} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </TableCell>
      <TableCell
        onClick={(e) => e.stopPropagation()}
      >
        {!isCurrentUser ? (
          <div className="">
            <div className="hidden sm:flex gap-2">
              <ResetPasswordAction
                targetUser={{ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }}
                onAlert={onAlert}
                onSuccess={onSuccess}
              >
                {({ open, loading }) => (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            open();
                          }}
                          disabled={loading}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors h-8 w-8 p-0"
                          aria-label={t("admin.users.table.ActionToolTips.resetPassword")}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("admin.users.table.ActionToolTips.resetPassword")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </ResetPasswordAction>

              <DeleteUserAction
                targetUser={{ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }}
                onAlert={onAlert}
                onSuccess={onSuccess}
              >
                {({ open, loading }) => (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            open();
                          }}
                          disabled={loading}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors h-8 w-8 p-0"
                          aria-label={t("admin.users.table.ActionToolTips.deleteUser")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("admin.users.table.ActionToolTips.deleteUser")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </DeleteUserAction>
            </div>

            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <ResetPasswordAction
                    targetUser={{ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }}
                    onAlert={onAlert}
                    onSuccess={onSuccess}
                  >
                    {({ open }) => (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          open();
                        }}
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                      >
                        <KeyRound className="h-4 w-4 mr-2 text-blue-500" />
                        {t("admin.users.table.ActionToolTips.resetPassword")}
                      </DropdownMenuItem>
                    )}
                  </ResetPasswordAction>
                  <DropdownMenuSeparator />
                  <DeleteUserAction
                    targetUser={{ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }}
                    onAlert={onAlert}
                    onSuccess={onSuccess}
                  >
                    {({ open }) => (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          open();
                        }}
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                        {t("admin.users.table.ActionToolTips.deleteUser")}
                      </DropdownMenuItem>
                    )}
                  </DeleteUserAction>
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

export function ModernAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  if (!alert) return null;

  const icon =
    alert.type === "success" ? <CheckCircle2 className="h-8 w-8 lg:h-6 lg:w-6 text-green-600" /> :
    alert.type === "error"   ? <XCircle className="h-8 w-8 lg:h-6 lg:w-6 text-red-600" /> :
    alert.type === "warning" ? <AlertTriangle className="h-8 w-8 lg:h-6 lg:w-6 text-yellow-600" /> :
                               <Info className="h-8 w-8 lg:h-6 lg:w-6 text-blue-600" />;

  return (
    <Alert
      className="mb-4"
      variant={
        alert.type === "success" ? "success" :
        alert.type === "error"   ? "destructive" :
        "default"
      }
    >
      <div className="flex items-center gap-2 w-full">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
            <AlertDescription>{alert.message}</AlertDescription>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 p-0 ml-auto">
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

export default function UsersTable() {
  const t = useTranslations();
  const { alert, showAlert, clearAlert } = useAlert();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [totalUser, setTotalUser] = useState(0);
  const [totalUserNotBoarded, setTotalUserNotBoarded] = useState(0);
  const [totalUserWithReservation, setTotalUserWithReservation] = useState(0);

  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);

  const pagination = usePagination(total, ITEMS_PER_PAGE);

  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const handleRowClick = useCallback((user: User) => {
    setSelectedUser(user.id);
    setIsDetailsOpen(true);
  }, []);

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("admin.users.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("admin.users.subtitle")}
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
                      <TableHead className="hidden lg:table-cell">{t("admin.users.table.header.email")}</TableHead>
                      <TableHead>{t("admin.users.table.header.name")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("admin.users.table.header.role")}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("admin.users.table.header.createdAt")}</TableHead>
                      <TableHead>{t("admin.users.table.header.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        isCurrentUser={currentUserId !== null && user.id === currentUserId}
                        onAlert={showAlert}
                        onSuccess={handleRefresh}
                        onRowClick={handleRowClick}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {total > ITEMS_PER_PAGE && (
                <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                  <PaginationControls
                    page={pagination.page}
                    totalItems={total}
                    pageSize={ITEMS_PER_PAGE}
                    onPageChange={pagination.goToPage}
                    siblingCount={1}
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
                {t("admin.users.searchResult.noUsersFound")}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 mx-auto">
                {searchQuery
                  ? t("admin.users.searchResult.noMatch")
                  : t("admin.users.searchResult.startByAdding")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
