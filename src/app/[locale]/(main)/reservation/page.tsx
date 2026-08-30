import ReservationLayout from '@/components/reservation/ReservationLayout';
import { ReservationProvider } from '@/context/ReservationContext';
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "reservation");
}

export default function ReservationPage() {
  return (
    <ReservationProvider>
      <ReservationLayout />
    </ReservationProvider>
  );
}