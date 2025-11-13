"use client";

import React, { use, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslations } from "next-intl";
import {
  User,
  Shield,
  Mail,
  Calendar,
  Info,
  LogIn,
  KeyRound,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type ReservationDetails = {
    id: string;
    console_id: number;
    console_name: string;
    game1_id: number | null;
    game1_name: string | null;
    game2_id: number | null;
    game2_name: string | null;
    game3_id: number | null;
    game3_name: string | null;
    start_time: string;
    end_time: string;
}

type UserDetails = {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
    isAdmin: boolean;
    createdAt: Date;
    LastLogin: Date;
};

type UserDetailsModalProps = {
  user: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function UserDetailsModal({
  user,
  open,
  onOpenChange,
}: UserDetailsModalProps) {

    const [userData, setUserData] = useState<UserDetails>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (user) {
            fetchUserDetails(user);
        }
    }, [user]);

    function fetchUserDetails(userId: number) {
        setLoading(true);
        fetch(`/api/admin/users/get-user-details?userId=${userId}`)
        .then(async (res) => {
            const data = await res.json();
            if (data.success) {
                setUserData(data.user);
            } else {
                setUserData(undefined);
            }
        })
        .catch((error) => {
            console.error("Erreur lors de la récupération des détails de l'utilisateur :", error);
            setUserData(undefined);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const t = useTranslations();

    if (!user) return null;

    if (loading) {
        return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-600" />
                {t("admin.users.details.title", {
                    defaultMessage: "Profil utilisateur",
                })}
                </DialogTitle>
            </DialogHeader>
            <div>
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-11 rounded-full mb-4 flex-shrink-0" />
                    <div className="flex flex-col w-full">
                        <Skeleton className="h-6 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
                <div className="flex">
                    <Skeleton className="h-10 w-full mr-2" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            </DialogContent>
        </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
                <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-cyan-600" />
                    {t("admin.users.details.title", {
                    defaultMessage: "Profil utilisateur",
                    })}
                </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-cyan-700 font-semibold text-lg">
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            {userData?.isAdmin ? (
                            <Badge className="bg-cyan-700 text-white border-0 text-[11px]">
                                <Shield className="h-3 w-3 mr-1" />
                                {t("admin.users.badge.admin")}
                            </Badge>
                            ) : (
                            <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-700 border-gray-200 text-[11px]"
                            >
                                <User className="h-3 w-3 mr-1" />
                                {t("admin.users.badge.user")}
                            </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Infos de base */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border border-gray-200 px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Prénom
                        </p>
                        <p className="font-medium">{userData?.firstname || "—"}</p>
                    </div>

                    <div className="rounded-md border border-gray-200 px-3 py-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Nom de famille
                        </p>
                        <p className="font-medium">{userData?.lastname || "—"}</p>
                    </div>

                    <div className="rounded-md border border-gray-200 px-3 py-2 sm:col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Courriel
                        </p>
                        <p className="font-medium break-all">{userData?.email}</p>
                    </div>

                    <div className="rounded-md border border-gray-200 px-3 py-2 sm:col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Date de création du compte
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="font-medium">
                                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("fr-CA") : "—"}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-md border border-gray-200 px-3 py-2 sm:col-span-2">
                        <p className="text-xs text-muted-foreground mb-0.5">
                            Dernière connexion au compte
                        </p>
                        <div className="flex items-center gap-1.5">
                            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="font-medium">
                                {userData?.LastLogin ? new Date(userData.LastLogin).toLocaleDateString("fr-CA", {second: '2-digit', minute: '2-digit', hour: '2-digit'}) : "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info administratives */}
                <Alert className="mt-1">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-xs sm:text-sm">
                    {t("admin.users.details.infoTitle", {
                        defaultMessage: "Informations administratives",
                    })}
                    </AlertTitle>
                    <AlertDescription className="text-xs sm:text-[13px]">
                    {userData?.isAdmin
                        ? t("admin.users.details.adminInfo", {
                            defaultMessage:
                            "Cet utilisateur possède des privilèges d’administrateur. Assurez-vous que ses accès soient sécurisés.",
                        })
                        : t("admin.users.details.userInfo", {
                            defaultMessage:
                            "Cet utilisateur possède un compte standard. Vous pouvez ajuster ses droits depuis le panneau d’administration.",
                        })}
                    </AlertDescription>
                </Alert>
                </div>
            </DialogContent>
        </Dialog>
    );
}
