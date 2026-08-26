import { notFound } from "next/navigation";
import DetailsReservationClient from "@/components/admin/reservations/details/DetailsReservationClient";

export default async function ReservationDetails({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  // La coquille (marges, carte blanche) vient de PageShell, côté client.
  return <DetailsReservationClient id={id} />;
}
