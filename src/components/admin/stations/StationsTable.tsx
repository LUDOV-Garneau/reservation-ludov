"use client";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trash2,
  Computer,
  Calendar,
  XCircle,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import CardStationStats from "./CardStats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ActionBar from "./ActionBar";
import PaginationControls from "../users/Pagination";
import UpdateStationForm from "./UpdateStationForm";

type Station = {
  id: number;
  name: string;
  consoles: string[];
  isActive: boolean;
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

function usePagination(
  totalItems: number,
  itemsPerPage: number = ITEMS_PER_PAGE
) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const goToNextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (pageNum: number) => {
      setPage(Math.max(1, Math.min(pageNum, totalPages)));
    },
    [totalPages]
  );

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

function StationTableRow({
  station,
  onDelete,
  onUpdate,
}: {
  station: Station;
  onDelete: (stationId: number, name: string) => void;
  onUpdate: (station: Station) => void;
}) {
  const t = useTranslations();
  return (
    <TableRow key={station.id} className="hover:bg-gray-200">
      <TableCell className="hidden lg:table-cell">{station.name}</TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-wrap gap-2">
          {station.consoles?.length ? (
            station.consoles.map((console, i) => (
              <span
                key={i}
                className="bg-gray-200 text-sm px-3 py-1 rounded-xl"
              >
                {console}
              </span>
            ))
          ) : (
            <p className="text-gray-500 italic">
              {t("admin.stations.table.noPlatforms")}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {station.isActive ? (
          <span className="text-green-600 font-medium">
            {t("admin.stations.table.active")}
          </span>
        ) : (
          <span className="text-red-600 font-medium">
            {t("admin.stations.table.inactive")}
          </span>
        )}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(station.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="">
          <div className="hidden sm:flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(station)}
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("admin.stations.table.ActionToolTips.updateStation")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(station.id, station.name)}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("admin.stations.table.ActionToolTips.deleteStation")}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onUpdate(station)}
                >
                  <Pencil className="h-4 w-4 mr-2 text-blue-500" />
                  {t("admin.stations.table.ActionToolTips.updateStation")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(station.id, station.name)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                  {t("admin.stations.table.ActionToolTips.deleteStation")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </TableCell>
    </TableRow>
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
          <Button
            variant="outline"
            onClick={onCancel}
            className="hover:bg-gray-100 w-full sm:w-auto"
          >
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
    alert.type === "success" ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : alert.type === "error" ? (
      <XCircle className="h-4 w-4 text-red-600" />
    ) : alert.type === "warning" ? (
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
    ) : (
      <Info className="h-4 w-4 text-blue-600" />
    );

  return (
    <Alert
      className="mb-4"
      variant={
        alert.type === "success"
          ? "default"
          : alert.type === "error"
          ? "destructive"
          : "default"
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

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
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

export default function StationsTable() {
  const t = useTranslations();
  const { alert, showAlert, clearAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [totalActiveStations, setTotalActiveStations] = useState(0);
  const [totalInactiveStations, setTotalInactiveStations] = useState(0);
  const [stationMostReservations, setStationMostReservations] = useState("");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [stationToUpdate, setStationToUpdate] = useState<Station | null>(null);

  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);

  const pagination = usePagination(total, ITEMS_PER_PAGE);

  useEffect(() => {
    fetchMetrics();
    fetchStations(pagination.page, ITEMS_PER_PAGE);
  }, [pagination.page]);

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery]);

  async function fetchMetrics() {
    try {
      setMetricsLoading(true);
      const res = await fetch("/api/admin/stations/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch stations stats");
      }

      const data = await res.json();
      setTotalActiveStations(data.data.totalActiveStations);
      setTotalInactiveStations(data.data.totalInactiveStations);
      setStationMostReservations(data.mostUsedName);
    } catch (error) {
      console.error("Error fetching stations stats:", error);
    } finally {
      setMetricsLoading(false);
    }
  }

  async function fetchStations(page = 1, limit = ITEMS_PER_PAGE) {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/stations?page=${page}&limit=${limit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur API stations");
      }

      const data = await res.json();
      const rows = data.data.stations ?? [];
      const totalCount = Number(data.data.total ?? 0);

      setStations(rows);
      setTotal(totalCount);
    } catch (error) {
      console.error(error);
      setStations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function handleUpdate(station: Station) {
    setStationToUpdate(station);
    setUpdateDialogOpen(true);
  }

  const filteredStations = stations.filter((station) => {
    const search = searchQuery.toLowerCase();
    return (
      station.name.toLowerCase().includes(search) ||
      station.consoles.join(" ").toLowerCase().includes(search)
    );
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMetrics(),
      fetchStations(pagination.page, pagination.itemsPerPage),
    ]);
    setIsRefreshing(false);
  }, [pagination.page, pagination.itemsPerPage]);

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("admin.stations.title")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("admin.stations.subtitle")}
        </p>
      </div>

      <CardStationStats
        loading={metricsLoading}
        activeStationsCount={totalActiveStations ?? 0}
        inactiveStationsCount={totalInactiveStations ?? 0}
        mostUsed={
          stationMostReservations ?? t("admin.stations.stats.noReservations")
        }
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
          ) : filteredStations.length > 0 ? (
            <>
              <div className="px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.stations.table.header.name")}
                      </TableHead>
                      <TableHead>
                        {t("admin.stations.table.header.platforms")}
                      </TableHead>
                      <TableHead>
                        {t("admin.stations.table.header.isActive")}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {t("admin.stations.table.header.createdAt")}
                      </TableHead>
                      <TableHead>
                        {t("admin.stations.table.header.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredStations.map((station) => (
                      <StationTableRow
                        key={station.id}
                        station={station}
                        onDelete={() =>
                          console.log("Delete station", station.id)
                        }
                        onUpdate={() => handleUpdate(station)}
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
                <Computer className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {t("admin.stations.searchResult.noStationsFound")}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 mx-auto">
                {searchQuery
                  ? t("admin.stations.searchResult.noMatch")
                  : t("admin.stations.searchResult.startByAdding")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {stationToUpdate && (
        <UpdateStationForm
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          station={stationToUpdate}
          onSuccess={() => {
            setUpdateDialogOpen(false);
            handleRefresh();
          }}
          onAlert={showAlert}
        />
      )}

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
