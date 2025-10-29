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
import { useTranslations } from "next-intl";

type Reservation = {
  id: number;
  console: string;
  games: string[];
  createdAt: string;
  station: string;
  date: string;
  etudiant_email: string;
};

export default function ReservationsTable({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [localRefreshKey] = useState(0);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/reservations?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Erreur de requête");
        const data = await res.json();
        setReservations(data.rows);
        setTotal(data.total);
      } catch (error) {
        console.error("Erreur lors du chargement des réservations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [refreshKey, localRefreshKey, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="w-full mx-auto mt-8 bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">{t("admin.reservations.title") || "Réservations"}</h2>

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
                <TableHead className="text-center">Console</TableHead>
                <TableHead className="text-center">Jeux</TableHead>
                <TableHead className="text-center">Station</TableHead>
                <TableHead className="text-center">Date de réservation</TableHead>
                <TableHead className="text-center">Créée le</TableHead>
                <TableHead className="text-center">Étudiant</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {reservations.length > 0 ? (
                reservations.map((resv) => (
                  <TableRow key={resv.id}>
                    <TableCell className="text-center font-medium">{resv.console}</TableCell>
                    <TableCell className="text-center">
                      {resv.games.length > 0
                        ? resv.games.join(", ")
                        : "Aucun jeu"}
                    </TableCell>
                    <TableCell className="text-center">{resv.station}</TableCell>
                    <TableCell className="text-center">
                      {new Date(resv.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(resv.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">{resv.etudiant_email}</TableCell>
                    <TableCell className="text-center space-x-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                        if (!confirm(`Supprimer cette réservation ?`)) return;
                        try {
                            const res = await fetch(`/api/admin/delete-reservation?reservationId=${resv.id}`, {
                            method: "DELETE",
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Erreur");
                            alert("Réservation supprimée");
                            setReservations((prev) => prev.filter((r) => r.id !== resv.id));
                        } catch (err) {
                            console.error(err);
                            alert("Erreur lors de la suppression");
                        }
                        }}
                    >
                        Supprimer
                    </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucune réservation trouvée
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
    </div>
  );
}
