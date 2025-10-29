"use client";

import React, { useEffect, useState } from "react";
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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, AlertCircle } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AddUserForm from "@/components/admin/components/AddUserForm";
import UsersForm from "@/components/admin/components/UsersForm";
import { useTranslations } from "next-intl";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  createdAt: string;
};

export default function UsersTable({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const handleRefresh = () => setLocalRefreshKey((prev: number) => prev + 1);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });
  const [resetDialog, setResetDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null,
  });

  const handleAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/login");
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUserId(Number(data.user?.id ?? null));
      } catch {
        setErrorMessage(
          "Erreur lors du chargement du compte utilisateur connecté."
        );
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUsers(data.rows);
        setTotal(data.total);
      } catch {
        setErrorMessage(
          "Erreur lors du chargement des utilisateurs. Veuillez réessayer ultérieurement."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshKey, localRefreshKey, page, limit]);

  let totalPages = Math.ceil(total / limit);
  if (totalPages === 0) totalPages = 1;

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    const { id, email } = deleteDialog.user;
    try {
      const res = await fetch(`/api/admin/delete-user?userId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        handleAlert("error", "Erreur lors de la suppression");
        return;
      }
      handleAlert("success", `Utilisateur ${email} supprimé`);
      handleRefresh();
    } catch {
      handleAlert("error", "Erreur réseau");
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  const handleResetPassword = async () => {
    if (!resetDialog.user) return;
    const { id, email } = resetDialog.user;
    try {
      const res = await fetch(`/api/admin/reset-password?userId=${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        handleAlert("error", "Erreur lors de la réinitialisation");
        return;
      }
      handleAlert("success", `Mot de passe de ${email} réinitialisé`);
      handleRefresh();
    } catch {
      handleAlert("error", "Erreur réseau");
    } finally {
      setResetDialog({ open: false, user: null });
    }
  };

  return (
    <div className="w-full mx-auto mt-8 bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">{t("admin.users.title")}</h2>
          <p className="text-sm text-muted-foreground">Gestion des comptes</p>
        </div>

        <Tooltip>
          <Popover>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="default"
                  className="mt-2 bg-cyan-500 hover:bg-cyan-700"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>

            <TooltipContent>
              <p>Ajouter des utilisateurs</p>
            </TooltipContent>

            <PopoverContent className="w-[210px] p-1 space-y-3 rounded-xl shadow-md">
              <div>
                <UsersForm onSuccess={handleRefresh} onAlert={handleAlert} />
                <AddUserForm onSuccess={handleRefresh} onAlert={handleAlert} />
              </div>
            </PopoverContent>
          </Popover>
        </Tooltip>
      </div>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4"
        >
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Prénom</TableHead>
                <TableHead className="text-center">Nom</TableHead>
                <TableHead className="text-center">Administrateur</TableHead>
                <TableHead className="text-center">Date de création</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center font-medium">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.firstName}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.lastName}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.isAdmin ? "Oui" : "Non"}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      {user.id !== currentUserId && (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({ open: true, user })
                            }
                          >
                            Supprimer
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetDialog({ open: true, user })}
                          >
                            Réinitialiser le mot de passe
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </>
      )}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{" "}
              <strong>{deleteDialog.user?.email}</strong> ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, user: null })}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetDialog.open}
        onOpenChange={(open) => setResetDialog({ open, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Cela définira le mot de passe de{" "}
              <strong>{resetDialog.user?.email}</strong> à nul.
              <br/>
              Continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialog({ open: false, user: null })}
            >
              Annuler
            </Button>
            <Button variant="default" onClick={handleResetPassword}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
