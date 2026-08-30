import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Configuration des traductions côté serveur.
 *
 * La langue vient du segment `[locale]` de l'URL. Elle était auparavant codée
 * en dur à « fr » : sans conséquence tant que seuls des composants clients
 * traduisaient (ils reçoivent leurs messages du `NextIntlClientProvider`), mais
 * tout appel à `getTranslations` renvoyait du français, y compris sur /en.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default;

  return { locale, messages };
});
