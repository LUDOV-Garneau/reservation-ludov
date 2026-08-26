import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Navigation consciente de la locale : à utiliser à la place de next/link et
 * next/navigation dans les composants, sinon le préfixe /fr ou /en est perdu.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
