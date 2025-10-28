'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import AccueilReservationSection from '@/components/reservation/components/AccueilReservationSection';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface Reservation {
    id: string;
    games: string[];
    console: string;
    date: string;
    heure: string;
}

export default function AccueilReservations() {
    const t = useTranslations();
    const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);
    const [pastReservations, setPastReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const errorMessage = t("reservation.accueil.errorFetching");

    useEffect(() => {
        async function fetchReservations() {
            try {
                setIsLoading(true);

                const upcomingReservationsResponse = await fetch("/api/reservation/upcoming-reservations");

                if (!upcomingReservationsResponse.ok) {
                    throw new Error('Error getting upcoming reservations');
                }

                const upcomingData = await upcomingReservationsResponse.json();
                const pastReservationsResponse = await fetch('/api/reservation/past-reservations');

                if (!pastReservationsResponse.ok) {
                    throw new Error('Error getting past reservations');
                }

                const pastData = await pastReservationsResponse.json();
                setUpcomingReservations(upcomingData);
                setPastReservations(pastData);
            } catch {
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }

        fetchReservations();
    }, [errorMessage]);

    const handleDetailsClick = (reservation: Reservation) => {
        router.push(`/reservation/details/${reservation.id}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-lg">{t("reservation.accueil.loadingReservations")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
                    <h1 className="text-2xl font-bold">{t("reservation.accueil.greeting")}</h1>
                    <Link href="/reservation">
                        <Button
                            className="bg-white hover:bg-green-600 text-green-500 border border-green-500 hover:text-white"
                        >
                            {t("reservation.new")}
                        </Button>
                    </Link>
                </div>


                {upcomingReservations.length > 0 ? (
                    <AccueilReservationSection
                        title={t("reservation.accueil.upcomingReservations")}
                        reservations={upcomingReservations}
                        onDetailsClick={handleDetailsClick}
                    />
                ) : (
                    <div className="w-full rounded-lg shadow-sm p-6 mb-6 text-center bg-[white]">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-300 pb-4">
                            {t("reservation.accueil.upcomingReservations")}
                        </h2>
                        <p className="text-gray-500">{t("reservation.accueil.noUpcomingReservations")}</p>
                    </div>
                )}

                {/* Historique des réservations */}
                {pastReservations.length > 0 ? (
                    <AccueilReservationSection
                        title={t("reservation.accueil.pastReservations")}
                        reservations={pastReservations}
                        onDetailsClick={handleDetailsClick}
                    />
                ) : (
                    <div className="w-full rounded-lg shadow-sm p-6 mb-6 text-center bg-[white]">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-cyan-300 pb-4">
                            {t("reservation.accueil.pastReservations")}
                        </h2>
                        <p className="text-gray-500">{t("reservation.accueil.noPastReservations")}</p>
                    </div>
                )}
            </div>
        </div>
    );
}