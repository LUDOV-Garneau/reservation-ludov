"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Calendar, Clock, Printer, Download, Home, Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReservation } from "@/context/ReservationContext";
import Image from "next/image";

interface ReservationDetails {
  reservationId: string;
  finalReservationId?: string;
  console?: any;
  games?: string[];
  jeux?: any[];
  date?: string;
  heure?: string;
}

export default function ReservationSuccess() {
  const router = useRouter();
  const { resetTimer } = useReservation();
  const [details, setDetails] = useState<ReservationDetails | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Récupérer les détails depuis sessionStorage
    const storedData = sessionStorage.getItem('last_reservation');
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setDetails(parsed);
        console.log("Détails récupérés:", parsed);
      } catch (err) {
        console.error("Erreur parsing données:", err);
      }
      
      // Nettoyer sessionStorage après récupération
      sessionStorage.removeItem('last_reservation');
    } else {
      // Si pas de données, rediriger vers l'accueil
      console.log("Aucune donnée de réservation trouvée");
      router.push('/');
      return;
    }

    // Réinitialiser le contexte
    resetTimer();
  }, [resetTimer, router]);

  const handleCopyReservationId = () => {
    if (details?.finalReservationId || details?.reservationId) {
      navigator.clipboard.writeText(details.finalReservationId || details.reservationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    // Logique pour envoyer un email de confirmation
    console.log("Envoi email confirmation...");
  };

  const handleBackHome = () => {
    router.push('/');
  };

  const handleNewReservation = () => {
    router.push('/reservation');
  };

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const reservationNumber = details.finalReservationId || details.reservationId || "N/A";

  return (
    <>
      {/* Version écran */}
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-cyan-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-12">
          
          {/* Animation de succès */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce-once">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Réservation Confirmée !
            </h1>
            
            <p className="text-lg text-gray-600">
              Votre réservation a été enregistrée avec succès
            </p>
          </div>

          {/* Numéro de réservation */}
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Numéro de réservation</p>
                <p className="text-2xl font-mono font-bold text-gray-900">
                  {reservationNumber}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReservationId}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copié !" : "Copier"}
              </Button>
            </div>
          </div>

          {/* Détails de la réservation */}
          <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Détails de votre réservation</h2>
            
            <div className="space-y-6">
              {/* Date et heure */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{details.date || "À confirmer"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Heure</p>
                    <p className="font-medium">{details.heure || "À confirmer"}</p>
                  </div>
                </div>
              </div>

              {/* Console */}
              {details.console && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Console réservée</h3>
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                    {details.console.image && (
                      <div className="relative w-16 h-16 rounded overflow-hidden bg-white">
                        <Image
                          src={details.console.image}
                          alt={details.console.name || details.console.nom}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="font-medium text-lg">
                      {details.console.name || details.console.nom || "Console"}
                    </p>
                  </div>
                </div>
              )}

              {/* Jeux */}
              {(details.jeux?.length > 0 || details.games?.length > 0) && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Jeux sélectionnés ({details.jeux?.length || details.games?.length})
                  </h3>
                  <div className="space-y-2">
                    {(details.jeux || details.games || []).map((jeu: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">
                          {typeof jeu === 'string' ? `Jeu #${jeu}` : jeu.nom || jeu.titre || `Jeu ${index + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">
              Informations importantes
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>• Présentez-vous 5 minutes avant l'heure prévue</li>
              <li>• Conservez votre numéro de réservation</li>
              <li>• Une pièce d'identité pourrait être demandée</li>
              <li>• En cas d'empêchement, merci de nous prévenir</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-12"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            
            <Button
              onClick={handleSendEmail}
              variant="outline"
              className="h-12"
            >
              <Mail className="mr-2 h-4 w-4" />
              Envoyer par email
            </Button>
            
            <Button
              onClick={handleNewReservation}
              variant="outline"
              className="h-12"
            >
              Nouvelle réservation
            </Button>
            
            <Button
              onClick={handleBackHome}
              className="h-12 bg-cyan-500 hover:bg-cyan-600"
            >
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Button>
          </div>
        </div>
      </div>

      {/* Version imprimable */}
      <div className="hidden print:block p-8">
        <h1 className="text-2xl font-bold mb-6">Confirmation de Réservation</h1>
        
        <div className="mb-6">
          <p className="font-semibold">Numéro de réservation :</p>
          <p className="text-xl font-mono">{reservationNumber}</p>
        </div>

        <div className="space-y-3">
          <div>
            <span className="font-semibold">Date :</span> {details.date || "À confirmer"}
          </div>
          <div>
            <span className="font-semibold">Heure :</span> {details.heure || "À confirmer"}
          </div>
          
          {details.console && (
            <div>
              <span className="font-semibold">Console :</span> {details.console.name || details.console.nom}
            </div>
          )}
          
          {(details.jeux?.length > 0 || details.games?.length > 0) && (
            <div>
              <p className="font-semibold mb-2">Jeux réservés :</p>
              <ul>
                {(details.jeux || details.games || []).map((jeu: any, i: number) => (
                  <li key={i}>
                    - {typeof jeu === 'string' ? `Jeu #${jeu}` : jeu.nom || jeu.titre || `Jeu ${i + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Document généré le {new Date().toLocaleDateString('fr-CA')} à {new Date().toLocaleTimeString('fr-CA')}
          </p>
        </div>
      </div>
    </>
  );
}