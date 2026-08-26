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
  BookOpen,
  Menu,
  Pencil,
  CircleAlert,
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
import ActionBar from "./ActionBar";
import PaginationControls from "../users/Pagination";
import { usePagination } from "@/hooks/usePagination";
import DeleteStationAction from "./DialogConfirmationDeleteCours";
import UpdateCoursForm from "./UpdateCoursForm";

type Cours = {
  id: number;
  nomCours: string;
  codeCours: string;
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

function CoursTableRow({
  cours,
  onAlert,
  onSuccess,
  onUpdate,
}: {
  cours: Cours;
  onUpdate: (cours: Cours) => void;
  onAlert: (
    type: "success" | "destructive" | "info" | "warning",
    message: string,
    title?: string
  ) => void;
  onSuccess: () => void;
}) {
  return (
    <TableRow key={cours.id}>
      <TableCell className="md:table-cell hidden">{cours.nomCours}</TableCell>
      <TableCell className="table-cell">{cours.codeCours}</TableCell>
      <TableCell className="table-cell text-right">
        <div>
          <div className="hidden md:flex gap-2 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(cours)}
                    className="hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-500 transition-colors h-8 w-8 p-0"
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
              targetCours={{ id: cours.id, name: cours.nomCours }}
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
                  <Pencil className="h-4 w-4 mr-2 text-cyan-500" />
                  Modifier le cours
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DeleteStationAction
                  targetCours={{ id: cours.id, name: cours.nomCours }}
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

export default function CoursTable() {
  const { showAlert } = useAlert();
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
    return cours.nomCours.toLowerCase().includes(search);
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCours(pagination.page, pagination.itemsPerPage)]);
    setIsRefreshing(false);
  }, [pagination.page, pagination.itemsPerPage]);

  return (
    <div className="w-full mx-auto mt-2 sm:mt-4 space-y-4 sm:space-y-6 px-2 sm:px-0">

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
                      <TableHead className="md:table-cell hidden">
                        Nom
                      </TableHead>
                      <TableHead className="table-cell">
                        Code du cours
                      </TableHead>
                      <TableHead className="table-cell text-right">
                        Actions
                      </TableHead>
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
            <EmptyState icon={BookOpen} title={"Aucun cours trouvé"} />
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
