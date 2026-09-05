"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Monitor } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Photo d'une plateforme ou d'un jeu dans le parcours de réservation.
 *
 * `unoptimized` comme dans l'onglet Plateformes de l'admin : les fichiers sont
 * servis par `/api/images/[...path]` depuis le volume `UPLOADS_DIR`, et passer
 * par l'optimiseur transformerait un fichier absent en 500 côté serveur au lieu
 * d'un simple 404 côté client.
 *
 * `onError` est la protection de production : `console_type.picture` et
 * `games.picture` peuvent pointer vers un fichier que le volume ne contient
 * pas — base restaurée sans le volume, volume recréé, image supprimée à la
 * main. On retombe alors sur la pastille, plutôt que sur une image cassée.
 */
export default function ReservationPhoto({
  picture,
  name,
  sizes,
  icon: Icon = Monitor,
  iconClassName = "h-12 w-12",
  className = "object-cover object-center",
}: {
  picture: string | null | undefined;
  name: string;
  sizes: string;
  icon?: LucideIcon;
  iconClassName?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // Changer d'image doit redonner sa chance à la nouvelle.
  useEffect(() => {
    setFailed(false);
  }, [picture]);

  if (!picture || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <Icon className={iconClassName} aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={picture}
      alt={name}
      fill
      unoptimized
      loading="lazy"
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
