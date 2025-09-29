import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "fr";

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
