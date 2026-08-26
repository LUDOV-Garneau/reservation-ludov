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
  Computer,
  Calendar,
  Menu,
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
import ActionBar from "./ActionBar";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "../users/Pagination";
import UpdateStationForm from "./UpdateStationForm";
import DeleteStationAction from "./DialogConfirmationDeleteStation";
import { Badge } from "@/components/ui/badge";

type Station = {
  id: number;
  name: string;
  consoles: string[];
  consolesId: number[];
  isActive: boolean;
  createdAt: string;
};

type ConfirmDialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant: "default" | "destructive";
  onConfirm: () => void;
} | null;

const ITEMS_PER_PAGE = 10;


function StationTableRow({
  station,
  onAlert,
  onSuccess,
  onUpdate,
}: {
  station: Station;
  onUpdate: (station: Station) => void;
  onAlert: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations();
  return (
    <TableRow key={station.id}>
      <TableCell className="table-cell">{station.name}</TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(station.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </TableCell>
      <TableCell className="table-cell text-center">
        {station.isActive ? (
          <Badge
            variant={"success"}
            className="rounded-full text-md w-full lg:w-[50%]"
          >
            {t("admin.stations.table.active")}
          </Badge>
        ) : (
          <Badge
            variant={"destructive"}
            className="rounded-full text-md w-full lg:w-[50%]"
          >
            {t("admin.stations.table.inactive")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div>
          <div className="hidden md:flex gap-2 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(station)}
                    className="hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-500 transition-colors h-8 w-8 p-0"
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

            <DeleteStationAction
              targetStation={{ id: station.id, name: station.name }}
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
                        onClick={open}
                        disabled={loading}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors h-8 w-8 p-0"
                        aria-label={t(
                          "admin.stations.table.ActionToolTips.deleteStation"
                        )}
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
              )}
            </DeleteStationAction>
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onUpdate(station)}>
                  <Pencil className="h-4 w-4 mr-2 text-cyan-500" />
                  {t("admin.stations.table.ActionToolTips.updateStation")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteStationAction
                  targetStation={{ id: station.id, name: station.name }}
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
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                      {t("admin.stations.table.ActionToolTips.deleteStation")}
                    </DropdownMenuItem>
                  )}
                </DeleteStationAction>
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StationsTable() {
  const t = useTranslations();
  const { showAlert } = useAlert();
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

  // Les statistiques ne changent pas en paginant : un seul chargement.
  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
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
      setStationMostReservations(data.data.mostUsedStationName);
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
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">

      <CardStationStats
        loading={metricsLoading}
        activeStationsCount={totalActiveStations ?? 0}
        inactiveStationsCount={totalInactiveStations ?? 0}
        mostUsed={stationMostReservations ?? "-"}
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
          ) : filteredStations.length > 0 ? (
            <>
              <div className="px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="table-cell">
                        {t("admin.stations.table.header.name")}
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-center">
                        {t("admin.stations.table.header.createdAt")}
                      </TableHead>
                      <TableHead className="text-center">
                        {t("admin.stations.table.header.isActive")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("admin.stations.table.header.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredStations.map((station) => (
                      <StationTableRow
                        key={station.id}
                        station={station}
                        onUpdate={() => handleUpdate(station)}
                        onAlert={showAlert}
                        onSuccess={handleRefresh}
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
            <EmptyState icon={Computer} title={t("admin.stations.searchResult.noStationsFound")} />
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
