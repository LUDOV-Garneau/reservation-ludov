"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Gamepad2, 
  Package, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen
} from "lucide-react";
import { useReservation } from "@/context/ReservationContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ReservationData {
  jeux: Array<{ id: number; nom: string; picture?: string; author?: string }>;
  console: { id: number; nom: string; image?: string } | null;
  accessoires: Array<{ id: number; nom: string }>;
  date: string | null;
  time: string | null;
  reservationId: string;
  cours: { id: number; code_cours: string; nom_cours: string} | null;
}

export default function ConfirmReservation() {
  const { 
    reservationId, 
    completeReservation, 
    isLoading: contextLoading,
    selectedConsole,
    selectedDate,
    selectedTime,
  } = useReservation();

  const router = useRouter();
  const [data, setData] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch des données de réservation
  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) {
        setError("Aucune réservation active");
        setLoading(false);
        return;
      }

      try {
        console.log("📥 Chargement réservation:", reservationId);
        
        const res = await fetch(`/api/reservation/get-reservation?id=${reservationId}`);
        if (!res.ok) throw new Error("Erreur chargement");
        
        const json = await res.json();
        console.log("📦 Données reçues:", json);

        setData({
          jeux: json.jeux || [],
          console: json.console || selectedConsole || null,
          accessoires: json.accessoires || [],
          date: json.date || (selectedDate ? selectedDate.toLocaleDateString('fr-CA') : null),
          time: json.time,
          reservationId: json.reservationId || reservationId,
          cours: json.cours || null,
        });

        console.log("✅ Données préparées");
      } catch (err) {
        console.error("❌ Erreur:", err);
        setError("Impossible de charger les détails");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, selectedConsole, selectedDate, selectedTime]);

  // Confirmation finale
  const handleConfirm = async () => {
    if (!reservationId || !data) {
      setError("Données manquantes");
      return;
    }
    
    console.log("🚀 Confirmation de la réservation...");
    setConfirmLoading(true);
    setError(null);
    
    try {
      await completeReservation();
      
      console.log("✅ Réservation confirmée, redirection...");
      router.push("/reservation/success");
    } catch (err) {
      console.error("❌ Erreur confirmation:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la confirmation");
      setConfirmLoading(false);
    }
  };

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Chargement de votre réservation...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700 mb-4">{error}</p>
          <Button onClick={() => router.push("/reservation")} variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isProcessing = confirmLoading || contextLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header avec timer */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[white] p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Confirmer votre réservation
            </h1>
            <p className="text-gray-600 mt-2">
              Vérifiez les détails avant de valider
            </p>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Console */}
          {data.console && (
            <div className="bg-[white] rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-cyan-500" />
                Console sélectionnée
              </h2>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={data.console.image || "/placeholder_consoles.jpg"}
                    alt={data.console.nom}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-xl font-medium">{data.console.nom}</p>
                  <p className="text-sm text-gray-500">Console de jeu</p>
                </div>
              </div>
            </div>
          )}

          {/* Jeux */}
          <div className="bg-[white] rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-500" />
              Jeux sélectionnés ({data.jeux.length})
            </h2>
            
            {data.jeux.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.jeux.map((jeu) => (
                  <div key={jeu.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="relative w-16 h-20 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                      {jeu.picture ? (
                        <Image
                          src={jeu.picture}
                          alt={jeu.nom}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-2 text-sm">
                        {jeu.nom}
                      </p>
                      {jeu.author && (
                        <p className="text-xs text-gray-500 mt-1">{jeu.author}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Aucun jeu sélectionné</p>
              </div>
            )}
          </div>

          {/* Accessoires */}
          {data.accessoires.length > 0 && (
            <div className="bg-[white] rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-500" />
                Accessoires ({data.accessoires.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.accessoires.map((acc) => (
                  <span 
                    key={acc.id} 
                    className="px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium border border-cyan-200"
                  >
                    {acc.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cours */}
          {data.cours && (
            <div className="bg-[white] rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-500" />
                Cours associé
              </h2>
              <div className="flex flex-wrap gap-2">
                <span
                  key={data.cours.id}
                  className="px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium border border-cyan-200"
                >
                  <p className="text-gray-700 font-medium">{data.cours.code_cours} - {data.cours.nom_cours}</p>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite - Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="bg-[white] rounded-xl shadow-sm border p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">Console</span>
                <span className="font-medium">
                  {data.console ? "✓ Sélectionnée" : "Aucune"}
                </span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b">
                <span className="text-gray-600">Jeux</span>
                <span className="font-medium">{data.jeux.length} / 3</span>
              </div>
              {data.accessoires.length > 0 && (
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-gray-600">Accessoires</span>
                  <span className="font-medium">{data.accessoires.length}</span>
                </div>
              )}
              {data.cours && (
                <div className="flex justify-between text-sm py-2 border-b">
                  <span className="text-gray-600">Cours</span>
                  <span className="font-medium">{data.cours.code_cours} - {data.cours.nom_cours}</span>
                </div>
              )}
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Date</span>
                  <span className="font-medium">{String(data.date).split('T')[0] || "Non définie"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Heure</span>
                  <span className="font-medium">{String(data.time).substring(0, 5) || "Non définie"}</span>
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-medium"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirmation en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Confirmer la réservation
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12"
                disabled={isProcessing}
                onClick={() => router.back()}
              >
                Retour
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              En confirmant, vous acceptez nos conditions d&apos;utilisation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}