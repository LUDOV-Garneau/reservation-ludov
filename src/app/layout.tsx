import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-titles",
});

export const metadata: Metadata = {
  title: "Module de réservation LUDOV",
  description:
    "Réservez une station avec une console et des jeux vidéo dans le cadre de vos études universitaires à l'université de Montréal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${nunito.variable}`}>
      <body className="font-body flex flex-col min-h-screen ">{children}</body>
    </html>
  );
}
