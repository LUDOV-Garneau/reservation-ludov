"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/admin/EmptyState";
import { PageShell, BackLink } from "@/components/layout/PageShell";
import { useRouter } from "@/i18n/navigation";

import { useUserDetail } from "@/components/admin/users/detail/useUserDetail";
import UserDetailHeader from "@/components/admin/users/detail/UserDetailHeader";
import UserIdentityCard from "@/components/admin/users/detail/UserIdentityCard";
import UserReservationCard from "@/components/admin/users/detail/UserReservationCard";
import { useCurrentUserId } from "@/components/admin/users/detail/useCurrentUserId";

type AlertType = "success" | "destructive" | "info" | "warning";

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("admin.users.detail");

  const userId = params?.id as string;
  const { user, reservations, counts, loading, error, reservationsError, refresh } =
    useUserDetail(userId);
  const currentUserId = useCurrentUserId();

  const showAlert = useCallback((type: AlertType, message: string, title?: string) => {
    const text = title ?? message;
    const options = title ? { description: message } : undefined;
    if (type === "success") toast.success(text, options);
    else if (type === "destructive") toast.error(text, options);
    else if (type === "warning") toast.warning(text, options);
    else toast.info(text, options);
  }, []);

  if (loading) {
    return (
      <PageShell>
        <BackLink onClick={() => router.back()} label={t("back")} />
        <DetailSkeleton />
      </PageShell>
    );
  }

  if (error || !user) {
    return (
      <PageShell>
        <BackLink onClick={() => router.back()} label={t("back")} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription>{error || t("errorLoad")}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={refresh}>
          {t("retry")}
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <BackLink onClick={() => router.back()} label={t("back")} />

      <div className="mx-auto w-full space-y-6">
        <UserDetailHeader
          user={user}
          isSelf={currentUserId !== null && currentUserId === user.id}
          onChanged={refresh}
          onAlert={showAlert}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <UserIdentityCard user={user} counts={counts} />
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gamepad2 className="h-4 w-4 text-cyan-600" />
                  {t("reservations", { count: counts.total })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reservationsError ? (
                  // Distingue l'échec de chargement d'un utilisateur qui n'a
                  // simplement jamais réservé.
                  <EmptyState
                    icon={AlertCircle}
                    title={t("reservationsError")}
                    description={reservationsError}
                    action={
                      <Button variant="outline" onClick={refresh}>
                        {t("retry")}
                      </Button>
                    }
                  />
                ) : reservations.length === 0 ? (
                  <EmptyState icon={Gamepad2} title={t("noReservations")} />
                ) : (
                  <div className="space-y-3">
                    {reservations.map((reservation) => (
                      <UserReservationCard
                        key={reservation.id}
                        reservation={reservation}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
