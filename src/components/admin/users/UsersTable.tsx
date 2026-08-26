"use client";

import { toast } from "sonner";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/admin/EmptyState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash2,
  KeyRound,
  Users,
  Shield,
  User,
  Calendar,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import CardUserStats from "./CardStats";
import ActionBar from "./ActionBar";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "./Pagination";
import ResetPasswordAction from "./DialogConfirmationResetsPassword";
import DeleteUserAction from "./DialogConfirmationDeleteUser";
import { useRouter } from "@/i18n/navigation";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
};

const ITEMS_PER_PAGE = 10;

async function fetchCurrentUserId(): Promise<number | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ? Number(data.id) : null;
  } catch {
    return null;
  }
}


function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  const t = useTranslations();
  return isAdmin ? (
    <Badge className="bg-cyan-500 text-white border-0 text-xs rounded-full">
      <Shield className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">{t("admin.users.badge.admin")}</span>
      <span className="sm:hidden">A</span>
    </Badge>
  ) : (
    <Badge className="bg-gray-700 text-white border-0 text-xs mt-1 rounded-full">
      <User className="h-3 w-3 mr-1" />
      {t("admin.users.badge.user")}
    </Badge>
  );
}

function UserTableRow({
  user,
  isCurrentUser,
  onAlert,
  onSuccess,
}: {
  user: User;
  isCurrentUser: boolean;
  onAlert: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  onSuccess: () => void;
  onRowClick: (user: User) => void;
}) {
  const t = useTranslations();
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/admin/user/${user.id}`);
  };

  return (
    <TableRow
      key={user.id}
      className="hover:bg-gray-100 cursor-pointer"
      onClick={handleRowClick}
    >
      <TableCell className="hidden lg:table-cell">{user.email}</TableCell>
      <TableCell>
        {user.firstName} {user.lastName}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <RoleBadge isAdmin={user.isAdmin} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {!isCurrentUser ? (
          <div className="">
            <div className="hidden sm:flex gap-2">
              <ResetPasswordAction
                targetUser={{
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                }}
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
                          className="hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-500 transition-colors h-8 w-8 p-0"
                          aria-label={t(
                            "admin.users.table.ActionToolTips.resetPassword"
                          )}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {t("admin.users.table.ActionToolTips.resetPassword")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </ResetPasswordAction>

              <DeleteUserAction
                targetUser={{
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                }}
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
                          aria-label={t(
                            "admin.users.table.ActionToolTips.deleteUser"
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {t("admin.users.table.ActionToolTips.deleteUser")}
                        </p>
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
                    targetUser={{
                      id: user.id,
                      email: user.email,
                      firstName: user.firstName,
                      lastName: user.lastName,
                    }}
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
                        <KeyRound className="h-4 w-4 mr-2 text-cyan-500" />
                        {t("admin.users.table.ActionToolTips.resetPassword")}
                      </DropdownMenuItem>
                    )}
                  </ResetPasswordAction>
                  <DropdownMenuSeparator />
                  <DeleteUserAction
                    targetUser={{
                      id: user.id,
                      email: user.email,
                      firstName: user.firstName,
                      lastName: user.lastName,
                    }}
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
          <span className="text-xs sm:text-sm text-muted-foreground px-2">
            -
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function useAlert() {
  // Les rétroactions passent par un toast (sonner) plutôt que par une bannière
  // dans la page : le <Toaster> est monté dans app/[locale]/layout.tsx.
  const showAlert = useCallback(
    (
      type: "success" | "destructive" | "info" | "warning",
      message: string,
      title?: string
    ) => {
      const text = title ?? message;
      const options = title ? { description: message } : undefined;

      if (type === "success") toast.success(text, options);
      else if (type === "destructive") toast.error(text, options);
      else if (type === "warning") toast.warning(text, options);
      else toast.info(text, options);
    },
    []
  );

  return { showAlert };
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
  const { showAlert } = useAlert();
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

  // Recherche débouncée (350 ms), envoyée au serveur : couvre toutes les pages.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCurrentUserId().then(setCurrentUserId);
    // Les statistiques ne changent pas en paginant : un seul chargement.
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchUsers(pagination.page, ITEMS_PER_PAGE, debouncedSearch);
  }, [pagination.page, debouncedSearch]);

  useEffect(() => {
    pagination.resetPage();
  }, [debouncedSearch]);

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

  async function fetchUsers(page = 1, limit = ITEMS_PER_PAGE, search = "") {
    try {
      setLoading(true);
      const searchParam = search
        ? `&search=${encodeURIComponent(search)}`
        : "";
      const res = await fetch(
        `/api/admin/users?page=${page}&limit=${limit}${searchParam}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

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

  // La recherche est faite côté serveur : la liste reçue est déjà filtrée.
  const filteredUsers = users;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMetrics(),
      fetchUsers(pagination.page, pagination.itemsPerPage, debouncedSearch),
    ]);
    setIsRefreshing(false);
  }, [pagination.page, pagination.itemsPerPage, debouncedSearch]);

  const handleRowClick = useCallback((user: User) => {
    setSelectedUser(user.id);
    setIsDetailsOpen(true);
  }, []);

  return (
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">

      <CardUserStats
        loading={metricsLoading}
        totalUser={totalUser ?? 0}
        totalUserNotBoarded={totalUserNotBoarded ?? 0}
        totalUserWithReservation={totalUserWithReservation ?? 0}
      />

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
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.users.table.header.email")}
                      </TableHead>
                      <TableHead>
                        {t("admin.users.table.header.name")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("admin.users.table.header.role")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.users.table.header.createdAt")}
                      </TableHead>
                      <TableHead>
                        {t("admin.users.table.header.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        isCurrentUser={
                          currentUserId !== null && user.id === currentUserId
                        }
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
            <EmptyState icon={Users} title={t("admin.users.searchResult.noUsersFound")} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
