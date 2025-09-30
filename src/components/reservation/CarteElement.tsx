"use client";

type CarteElementProps = {
  nom: string;
  image?: string;
  description?: string;
  materielRequis?: string;
  station?: string;
};

export default function CarteElement({ nom, image, description, materielRequis }: CarteElementProps) {
  const isHorizontalLayout = description || (materielRequis && materielRequis.length > 0);

  if (isHorizontalLayout) {
    return (
      <div className="flex flex-col sm:flex-row items-start gap-4 rounded-2xl border bg-white shadow-sm p-4">
        <div className="w-48 h-48 flex-shrink-0 rounded-xl bg-gradient-to-b from-neutral-200 to-neutral-300 mx-auto sm:mx-0" />
        
        <div className="flex-1 w-full">
          <h4 className="text-2xl font-semibold mb-2 text-center sm:text-left">{nom}</h4>
          
          {description && (
            <>
              <h4 className="mb-1">Description :</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line mb-2">{description}</p>
            </>
          )}
          
          {materielRequis && (
            <>
              <h4 className="mb-1">Matériel requis :</h4>
              <p className="text-sm text-gray-500 whitespace-pre-line mb-2">{materielRequis}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border bg-white shadow-sm p-4 sm:p-6 flex flex-col items-center text-center">
      <div className="w-40 h-40 rounded-xl bg-gradient-to-b from-neutral-200 to-neutral-300 mb-3" />
      <p className="text-gray-600">{nom}</p>
    </div>
  );
}