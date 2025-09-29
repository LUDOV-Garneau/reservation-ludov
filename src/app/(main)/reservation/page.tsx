import ReservationLayout from '@/components/reservation/ReservationLayout';
import { ReservationProvider } from '@/context/ReservationContext';

export default function ReservationPage() {
  return (
    <ReservationProvider>
      <ReservationLayout />
    </ReservationProvider>
  );
}