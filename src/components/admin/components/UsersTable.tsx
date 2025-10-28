"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import AddUserForm from "@/components/admin/components/AddUserForm";
import UsersForm from "@/components/admin/components/UsersForm";
import { useTranslations } from "next-intl";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch("/api/auth/login");
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUserId(Number(data.user?.id ?? null));
      } catch (err) {
        console.error("Erreur lors du fetch du user connecté :", err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Erreur de requête");
        const data = await res.json();
        setUsers(data.rows);
        setTotal(data.total);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshKey, localRefreshKey, page, limit]);

  let totalPages = Math.ceil(total / limit);
  if (totalPages === 0) totalPages = 1;

  const handleDelete = async (userId: number, email: string) => {
    if (!confirm(`Supprimer l’utilisateur ${email} ?`)) return;
    try {
      const res = await fetch(`/api/admin/delete-user?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Erreur lors de la suppression");
        return;
      }
      toast.success("Utilisateur supprimé");
      handleRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau");
    }
  };

  const handleResetPassword = async (userId: number, email: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${email} ? (définira le mot de passe à une chaîne vide)`)) return;
    try {
      const res = await fetch(`/api/admin/reset-password?userId=${userId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Erreur lors de la réinitialisation");
        return;
      }
      toast.success("Mot de passe réinitialisé");
      handleRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau");
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>Gestion des comptes</CardDescription>
        </div>
        <Tooltip>
          <Popover>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="default" className="mt-2">
                  <Plus className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>

            <TooltipContent>
              <p>Ajouter des utilisateurs</p>
            </TooltipContent>

            <PopoverContent className="w-auto">
              <div className="space-y-4 flex flex-col items-center">
                <UsersForm onSuccess={handleRefresh} />
                <AddUserForm onSuccess={handleRefresh} />
              </div>
            </PopoverContent>
          </Popover>
        </Tooltip>
      </CardHeader>
      <CardContent>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Administrateur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell>{user.isAdmin ? "Oui" : "Non"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {user.id !== currentUserId && (
                          <>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(user.id, user.email)}
                            >
                              Supprimer
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(user.id, user.email)}
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}