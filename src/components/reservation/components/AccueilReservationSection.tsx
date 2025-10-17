import React from 'react';
import AccueilReservationCard from './AccueilReservationCard';

interface Reservation {
    id: string;
    games: string[];
    console: string;
    date: string;
    heure: string;
}

interface AccueilReservationSectionProps {
    title: string;
    reservations: Reservation[];
    onDetailsClick?: (reservation: Reservation) => void;
}

export default function AccueilReservationSection({
    title,
    reservations,
    onDetailsClick,
}: AccueilReservationSectionProps) {
    return (
        <div className="w-full rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-center mb-6 border-b-2 border-cyan-300">
                {title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reservations.map((reservation, index) => (
                    <AccueilReservationCard
                        key={reservation.id || index}
                        games={reservation.games}
                        console={reservation.console}
                        date={reservation.date}
                        heure={reservation.heure}
                        onDetailsClick={() => onDetailsClick?.(reservation)}
                    />
                ))}
            </div>
        </div>
    );
}
