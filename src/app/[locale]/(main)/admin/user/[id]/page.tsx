"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  User,
  Shield,
  Mail,
  Calendar,
  KeyRound,
  ArrowLeft,
  Clock,
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  Monitor,
  CircleX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator"

type UserDetails = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  isAdmin: number;
  lastUpdated: Date;
  createdAt: Date;
  LastLogin: Date;
};

type Reservation = {
  id: string;
  games: string[];
  console: string;
  date: string;
  heure: string;
  archived: boolean;
  status?: "upcoming" | "ongoing" | "completed";
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  
  const userId = params?.id as string;

  const [userData, setUserData] = useState<UserDetails | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchUserReservations();
    }
  }, [userId]);

  async function fetchUserData() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/users/get-user-details?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur API utilisateurs");
      }

      const data = await res.json();

      setUserData(data.user);

    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserReservations() {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reservations`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erreur API réservations");
      }

      const reservationsData = await res.json();

      const now = new Date();
      const reservationsWithStatus = reservationsData.reservations.map((res: Reservation) => {
        const startTime = new Date(`${res.date}T${res.heure}`);
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

        let status: "upcoming" | "ongoing" | "completed" | "canceled";
        if (res.archived) status = "canceled";
        else if (now < startTime) status = "upcoming";
        else if (now >= startTime && now <= endTime) status = "ongoing";
        else status = "completed";

        return { ...res, status };
      });

      setReservations(reservationsWithStatus);

    } catch (err) {
      console.error("Error fetching user reservations:", err);
    }
  }

  function getStatusBadge(status?: "upcoming" | "ongoing" | "completed" | "canceled") {
    switch (status) {
      case "upcoming":
        return (
          <Badge className="bg-cyan-100 text-cyan-900 border-cyan-200 text-sm">
            <Clock className="h-3 w-3 mr-1" />
            À venir
          </Badge>
        );
      case "ongoing":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-sm">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm">
            Terminée
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-sm">
            <CircleX className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error || "Impossible de charger les données de l'utilisateur"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Profil de {userData.firstname} {userData.lastname}
        </h1>
        <p className="text-muted-foreground">
          Informations détaillées et historique des réservations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-600" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b">
                <div className="flex-1">
                  <h4 className="font-bold text-3xl">
                    {userData.firstname} {userData.lastname}
                  </h4>
                  {userData.isAdmin ? (
                    <Badge className="bg-cyan-700 text-white border-0 text-xs mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      Administrateur
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs mt-1">
                      <User className="h-3 w-3 mr-1" />
                      Utilisateur
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-cyan-700" />
                  <p className="text-cyan-700 font-bold">Courriel</p>
                </div>
                <p className="font-medium break-all text-sm">{userData.email}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-700" />
                  <p className="text-cyan-700 font-bold">Créer le</p>
                </div>

                <p className="font-medium text-sm">
                  {new Date(userData.createdAt).toLocaleDateString("fr-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-cyan-700" />
                  <p className="font-bold text-cyan-700">Dernière connexion</p>
                </div>
                <p className="font-medium text-sm">
                  {userData.LastLogin
                    ? new Date(userData.LastLogin).toLocaleDateString("fr-CA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Jamais"}
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-600">
                      {reservations.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Réservations</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {reservations.filter(r => r.status === "completed").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Complétées</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-cyan-600" />
                Réservation de l&apos;utilisateur ({reservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!reservations ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Gamepad2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune réservation
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Cet utilisateur n&apos;a pas encore effectué de réservation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <Card key={reservation.id} className="border-2 py-0 hover:shadow-lg transition-all duration-300 hover:border-cyan-500 ease-in-out">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-xl text-cyan-600 line-clamp-1">
                              {reservation.id}
                            </h4>
                          </div>
                          {getStatusBadge(reservation.status)}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-md">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(`${reservation.date}T${reservation.heure}`).toLocaleDateString("fr-CA")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-md">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(`${reservation.date}T${reservation.heure}`).toLocaleTimeString("fr-CA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(new Date(`${reservation.date}T${reservation.heure}`).getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString("fr-CA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <Monitor className="h-5 w-5 text-cyan-700"/>
                            <p className="text-cyan-700">Console</p>
                          </div>
                          <Badge variant={"games"} className="text-sm">
                            {reservation.console}
                          </Badge>
                        </div>

                        <Separator className="my-2" />

                        {reservation.games.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <Gamepad2 className="h-5 w-5 text-cyan-700" />
                              <p className="text-cyan-700">Jeux sélectionnés</p>
                            </div>
                            <div className="flex flex-wrap gap-2 overflow-clip">
                              {reservation.games.map((game, index) => (
                                <Badge key={index} variant="games" className="text-sm">
                                  {game}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}