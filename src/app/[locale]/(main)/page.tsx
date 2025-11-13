"use client";

import AccueilReservations from "@/components/reservation/AccueilReservation";

// export const metadata: Metadata = {
//   title: "Module de réservation LUDOV",
//   description:
//     "Réservez une station avec une console et des jeux vidéo dans le cadre de vos études universitaires à l'université de Montréal.",
// };

export default function HomePage() {
  return (
    <div>
      <AccueilReservations />
    </div>
  );
}
