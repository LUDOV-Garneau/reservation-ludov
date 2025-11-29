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
  BookOpen,
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
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ActionBar from "./ActionBar";
import PaginationControls from "../users/Pagination";
import DeleteStationAction from "./DialogConfirmationDeleteCours";
import UpdateCoursForm from "./UpdateCoursForm";

type Cours = {
  id: number;
  nom_cours: string;
  code_cours: string;
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

function CoursTableRow({
  cours,
  onAlert,
  onSuccess,
  onUpdate,
}: {
  cours: Cours;
  onUpdate: (cours: Cours) => void;
  onAlert: (
    type: "success" | "error" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  onSuccess: () => void;
}) {
  return (
    <TableRow key={cours.id}>
      <TableCell className="table-cell">{cours.nom_cours}</TableCell>
      <TableCell className="text-center">{cours.code_cours}</TableCell>
      <TableCell className="text-right">
        <div>
          <div className="hidden md:flex gap-2 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(cours)}
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Modifier le cours</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DeleteStationAction
              targetCours={{ id: cours.id, name: cours.nom_cours }}
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
                        aria-label="Supprimer le cours"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Supprimer le cours</p>
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
                <DropdownMenuItem onClick={() => onUpdate(cours)}>
                  <Pencil className="h-4 w-4 mr-2 text-blue-500" />
                  Modifier le cours
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteStationAction
                  targetCours={{ id: cours.id, name: cours.nom_cours }}
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
                      Supprimer le cours
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

export default function CoursTable() {
  const { alert, showAlert, clearAlert } = useAlert();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [coursToUpdate, setCoursToUpdate] = useState<Cours | null>(null);

  const [loading, setLoading] = useState(false);

  const [cours, setCours] = useState<Cours[]>([]);
  const [total, setTotal] = useState(0);

  const pagination = usePagination(total, ITEMS_PER_PAGE);

  useEffect(() => {
    fetchCours(pagination.page, ITEMS_PER_PAGE);
  }, [pagination.page]);

  useEffect(() => {
    pagination.resetPage();
  }, [searchQuery]);

  async function fetchCours(page = 1, limit = ITEMS_PER_PAGE) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/cours?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur API cours");
      }

      const data = await res.json();
      const rows = data.data.cours ?? [];
      const totalCount = Number(data.data.total ?? 0);

      setCours(rows);
      setTotal(totalCount);
    } catch (error) {
      console.error(error);
      setCours([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  function handleUpdate(cours: Cours) {
    setCoursToUpdate(cours);
    setUpdateDialogOpen(true);
  }

  const filteredStations = cours.filter((cours) => {
    const search = searchQuery.toLowerCase();
    return cours.nom_cours.toLowerCase().includes(search);
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCours(pagination.page, pagination.itemsPerPage)]);
    setIsRefreshing(false);
  }, [pagination.page, pagination.itemsPerPage]);

  return (
    <div className="w-full mx-auto mt-4 sm:mt-6 lg:mt-8 space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cours</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Gérez les cours de la plateforme LUDOV
        </p>
      </div>

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
                      <TableHead className="table-cell">Nom</TableHead>
                      <TableHead className="text-center">
                        Code du cours
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredStations.map((cours) => (
                      <CoursTableRow
                        key={cours.id}
                        cours={cours}
                        onUpdate={() => handleUpdate(cours)}
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
            <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-3 sm:mb-4">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Aucun cours trouvé
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 mx-auto">
                {searchQuery
                  ? "Aucun cours ne correspond à votre recherche."
                  : "Commencez par ajouter votre premier cours."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {coursToUpdate && (
        <UpdateCoursForm
          open={updateDialogOpen}
          onOpenChange={setUpdateDialogOpen}
          cours={coursToUpdate}
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
