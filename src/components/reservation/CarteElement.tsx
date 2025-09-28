"use client";

type CarteElementProps = {
  nom: string;
  image?: string;
  description?: string;
  materielRequis?: string[];
};

export default function CarteElement({ nom, image, description, materielRequis }: CarteElementProps) {
  return (
    <div className="h-full rounded-2xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col items-center text-center">
      <div className="w-40 h-40 rounded-xl bg-gradient-to-b from-neutral-200 to-neutral-300 mb-3" />

      <p className="text-gray-600">{nom}</p>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}

      {!!materielRequis?.length && (
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground text-left">
          {materielRequis.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
