import { notFound } from "next/navigation";
import DetailsReservationClient from "@/components/reservation/DetailsReservationClient";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  return pageMetadata(params, "reservationDetails");
}

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
