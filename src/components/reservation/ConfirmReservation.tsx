"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Gamepad2, 
  Package, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useReservation } from "@/context/ReservationContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ---------------------
// Types
// ---------------------
interface Game {
  id: number;
  nom: string;
  picture?: string;
  author?: string;
}

interface Console {
  id: number;
  nom: string;
  image?: string;
}

interface Accessoire {
  id: number;
  nom: string;
}

interface Station {
  id: number;
  nom: string;
}

interface ReservationData {
  jeux: Game[];
  console: Console | null;
  accessoires: Accessoire[];
  date: string;
  heure: string;
  station?: Station | null;
}

export default function ConfirmReservation() {
  const { 
    reservationId, 
    completeReservation, 
    isLoading: contextLoading,
    selectedConsole,
    timeRemaining
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
        const res = await fetch(`/api/reservation/get-reservation?id=${reservationId}`);
        if (!res.ok) throw new Error("Erreur chargement");
        
        const json = await res.json();

        setData({
          jeux: (json.jeux || []) as Game[],
          console: (json.console || selectedConsole || null) as Console | null,
          accessoires: (json.accessoires || []) as Accessoire[],
          date: (json.date || new Date().toLocaleDateString("fr-CA")) as string,
          heure: (json.heure || "À déterminer") as string,
          station: (json.station || null) as Station | null,
        });
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les détails");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, selectedConsole]);

  // Confirmation finale
  const handleConfirm = async () => {
    if (!reservationId || !data) return;
    
    setConfirmLoading(true);
    setError(null);
    
    try {
      await completeReservation();
      
      // Sauvegarder les détails pour la page de succès
      sessionStorage.setItem(
        "last_reservation", 
        JSON.stringify({
          ...data,
          reservationId,
        })
      );
      
      router.push("/reservation/success");
    } catch (err) {
      console.error("Erreur confirmation:", err);
      setError("Erreur lors de la confirmation");
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Confirmer votre réservation
            </h1>
            <p className="text-gray-600 mt-2">
              Vérifiez les détails avant de valider
            </p>
          </div>
          
          {/* Timer et infos */}
          <div className="flex flex-wrap items-center gap-3">
            {timeRemaining > 0 && (
              <div className={`px-4 py-2 rounded-full ${
                timeRemaining < 120 
                  ? "bg-red-50 text-red-700 animate-pulse" 
                  : "bg-gray-100 text-gray-700"
              }`}>
                <Clock className="inline h-4 w-4 mr-1" />
                {Math.floor(timeRemaining / 60)}:
                {(timeRemaining % 60).toString().padStart(2, "0")}
              </div>
            )}
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{data.date}</span>
              <span className="text-gray-400">|</span>
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{data.heure}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Console */}
          {data.console && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
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
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-500" />
              Jeux sélectionnés ({data.jeux.length})
            </h2>
            
            {data.jeux.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.jeux.map((jeu) => (
                  <div key={jeu.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="relative w-16 h-16 rounded bg-gray-200 flex-shrink-0">
                      {jeu.picture ? (
                        <Image
                          src={jeu.picture}
                          alt={jeu.nom}
                          fill
                          className="object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{jeu.nom}</p>
                      {jeu.author && (
                        <p className="text-xs text-gray-500">{jeu.author}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Aucun jeu sélectionné</p>
            )}
          </div>

          {/* Accessoires */}
          {data.accessoires.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Accessoires</h2>
              <div className="flex flex-wrap gap-2">
                {data.accessoires.map((acc) => (
                  <span key={acc.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {acc.nom}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Console</span>
                <span className="font-medium">
                  {data.console ? "1" : "0"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jeux</span>
                <span className="font-medium">{data.jeux.length}</span>
              </div>
              {data.accessoires.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Accessoires</span>
                  <span className="font-medium">{data.accessoires.length}</span>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">{data.date}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Heure</span>
                  <span className="font-medium">{data.heure}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p>Réservation confirmer</p>
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
                    Confirmation...
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
                onClick={() => router.push("/reservation")}
              >
                Retour
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              En confirmant, vous acceptez nos conditions d'utilisation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
