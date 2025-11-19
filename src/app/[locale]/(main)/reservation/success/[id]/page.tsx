import { notFound } from "next/navigation";
import ConfirmedReservationClient from "@/components/reservation/ConfirmedReservationClient";

export default async function ReservationSuccess({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  if (!id) {
    notFound();
  }

  return (
    <div className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl">
      <ConfirmedReservationClient reservationId={id} />
    </div>
  );
}
