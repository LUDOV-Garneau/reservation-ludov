import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { SITE_NAME } from "@/lib/metadata";

/**
 * Le gabarit complete le titre de chaque page : « Connexion » devient
 * « Connexion · LUDOV ». Une page sans titre propre retombe sur `default`.
 */
export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
};

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${nunito.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
