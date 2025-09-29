// import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
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

// export const metadata: Metadata = {
//   title: "Module de réservation LUDOV",
//   description:
//     "Réservez une station avec une console et des jeux vidéo dans le cadre de vos études universitaires à l'université de Montréal.",
// };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale} className={`${inter.variable} ${nunito.variable}`}>
      <body className="font-body">
        <IntlWrapper locale={locale}>{children}</IntlWrapper>
      </body>
    </html>
  );
}

async function IntlWrapper({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const messages = (await import(`../../i18n/messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
