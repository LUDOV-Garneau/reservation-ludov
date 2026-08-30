import AccueilReservations from "@/components/reservation/AccueilReservation";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata(params, "home");
}

export default function HomePage() {
  return (
    <div>
      <AccueilReservations />
    </div>
  );
}
