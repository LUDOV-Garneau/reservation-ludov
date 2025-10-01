import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="md:px-[60px] px-6 py-[30px] mx-auto w-full max-w-7xl">
      <Link href="/reservation">
        <Button>Nouvelle réservation</Button>
      </Link>
    </div>
  );
}