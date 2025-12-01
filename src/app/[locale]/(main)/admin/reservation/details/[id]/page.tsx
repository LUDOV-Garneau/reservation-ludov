import { notFound } from "next/navigation";
import DetailsReservationClient from "@/components/admin/reservations/DetailsReservationClient";

export default async function ReservationDetails({
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
      <DetailsReservationClient id={id} />
    </div>
  );
}
