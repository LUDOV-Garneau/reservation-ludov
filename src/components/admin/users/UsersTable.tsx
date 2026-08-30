"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { AlertCircle, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/admin/EmptyState";
import { PAGE_SIZE_OPTIONS } from "@/hooks/useAdminUsersFilters";

import { useAdminUsers } from "./useAdminUsers";
import { useUserSelection } from "./useUserSelection";
import UsersStatsBar from "./UsersStatsBar";
import UsersFilters from "./UsersFilters";
import UsersBulkBar from "./UsersBulkBar";
import SortableHeader from "./SortableHeader";
import UserRow from "./UserRow";
import UsersTableSkeleton from "./UsersTableSkeleton";
import PaginationControls from "./Pagination";

type AlertType = "success" | "destructive" | "info" | "warning";

/**
 * Les rétroactions passent par un toast (sonner) plutôt que par une bannière
 * dans la page : le <Toaster> est monté dans app/[locale]/layout.tsx.
 */
function useAlert() {
  return useCallback((type: AlertType, message: string, title?: string) => {
    const text = title ?? message;
    const options = title ? { description: message } : undefined;

    if (type === "success") toast.success(text, options);
    else if (type === "destructive") toast.error(text, options);
    else if (type === "warning") toast.warning(text, options);
    else toast.info(text, options);
  }, []);
}

export default function UsersTable() {
  const t = useTranslations("admin.users");
  const showAlert = useAlert();

  const {
    users,
    pageIds,
    total,
    loading,
    error,
    stats,
    statsLoading,
    currentUserId,
    isRefreshing,
    filters,
    setFilters,
    toggleSort,
    clearFilters,
    activeFilterCount,
    refresh,
    retry,
    viewKey,
  } = useAdminUsers();

  // Le compte connecté n'est pas sélectionnable : les endpoints refusent déjà
  // l'auto-action, il n'a donc pas de case à cocher.
  const selectableIds = useMemo(
    () => pageIds.filter((id) => id !== currentUserId),
    [pageIds, currentUserId],
  );

  const selection = useUserSelection(selectableIds, viewKey);

  return (
    <div className="mx-auto mt-2 w-full space-y-4 px-2 sm:mt-4 sm:space-y-6 sm:px-0">
      <UsersStatsBar
        stats={stats}
        loading={statsLoading}
        status={filters.status}
        onStatusChange={(status) => setFilters({ status })}
      />

      <Card className="shadow-sm">
        <CardHeader className="border-b p-4 sm:p-6">
          {selection.count > 0 ? (
            <UsersBulkBar
              selectedIds={selection.selected}
              onClear={selection.clear}
              onDone={refresh}
              onAlert={showAlert}
            />
          ) : (
            <UsersFilters
              filters={filters}
              setFilters={setFilters}
              clearFilters={clearFilters}
              activeFilterCount={activeFilterCount}
              totalItems={total}
              totalUsers={stats?.totalUser ?? total}
              isRefreshing={isRefreshing}
              onRefresh={refresh}
              onSuccess={refresh}
              onAlert={showAlert}
            />
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 sm:p-6">
              <UsersTableSkeleton rows={Math.min(filters.pageSize, 5)} />
            </div>
          ) : error ? (
            // Distingue l'échec du chargement d'une liste réellement vide.
            <EmptyState
              icon={AlertCircle}
              title={t("error.loadFailed")}
              description={error}
              action={
                <Button variant="outline" onClick={retry}>
                  {t("error.retry")}
                </Button>
              }
            />
          ) : users.length > 0 ? (
            <>
              <div className="px-4 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selection.allSelected
                              ? true
                              : selection.someSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={selection.toggleAll}
                          disabled={selectableIds.length === 0}
                          aria-label={t("bulk.selectAll")}
                        />
                      </TableHead>
                      <SortableHeader
                        sortKey="name"
                        label={t("table.header.user")}
                        activeSort={filters.sort}
                        order={filters.order}
                        onSort={toggleSort}
                      />
                      <SortableHeader
                        sortKey="role"
                        label={t("table.header.role")}
                        activeSort={filters.sort}
                        order={filters.order}
                        onSort={toggleSort}
                      />
                      <TableHead>{t("table.header.status")}</TableHead>
                      <SortableHeader
                        sortKey="lastLogin"
                        label={t("table.header.lastLogin")}
                        activeSort={filters.sort}
                        order={filters.order}
                        onSort={toggleSort}
                        className="hidden md:table-cell"
                      />
                      <SortableHeader
                        sortKey="createdAt"
                        label={t("table.header.createdAt")}
                        activeSort={filters.sort}
                        order={filters.order}
                        onSort={toggleSort}
                        className="hidden lg:table-cell"
                      />
                      <TableHead className="w-16 text-right">
                        <span className="sr-only">{t("table.header.actions")}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        isCurrentUser={currentUserId !== null && user.id === currentUserId}
                        selected={selection.isSelected(user.id)}
                        onToggleSelect={selection.toggle}
                        onAlert={showAlert}
                        onSuccess={refresh}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-4 pb-3 sm:px-6 sm:pb-4">
                <PaginationControls
                  page={filters.page}
                  totalItems={total}
                  pageSize={filters.pageSize}
                  onPageChange={(page) => setFilters({ page })}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  onPageSizeChange={(pageSize) => setFilters({ pageSize })}
                  siblingCount={1}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={Users}
              title={
                activeFilterCount > 0
                  ? t("searchResult.noMatch")
                  : t("searchResult.noUsersFound")
              }
              description={
                activeFilterCount > 0 ? undefined : t("searchResult.startByAdding")
              }
              action={
                activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("filters.clear")}
                  </Button>
                ) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
