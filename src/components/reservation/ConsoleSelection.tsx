"use client"

import { useReservation } from "@/context/ReservationContext"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

// Types pour les consoles
interface Console {
  id: number;
  name: string;
  description: string;
  available: boolean;
  price?: number;
}

export default function ConsoleSelection() {
  const { 
    selectedConsole, 
    setSelectedConsole, 
    setCurrentStep,
    startTimer,
    setUserId
  } = useReservation();

  // Données fictives
  const [consoles] = useState<Console[]>([
    {
      id: 1,
      name: 'PlayStation 5',
      description: 'Console next-gen avec manette DualSense',
      available: true,
      price: 25
    },
    {
      id: 2,
      name: 'Xbox Series X',
      description: 'Puissance de jeu 4K optimisée',
      available: true,
      price: 25
    },
    {
      id: 3,
      name: 'Nintendo Switch',
      description: 'Console portable et de salon',
      available: false,
      price: 20
    }
  ]);

    const handleConsoleSelect = (consoleId: number) => {
        const console = consoles.find(c => c.id === consoleId);
        if (console && console.available) {
            setSelectedConsole(consoleId);
            setUserId(1); // 👈 identifiant fictif pour débloquer le timer
        }
    };

    const handleContinue = () => {
    if (!selectedConsole) return;

    startTimer();  // démarre le timer (mock ou réel)
    setCurrentStep(2); // passe direct à l'étape suivante
    };



  const canContinue = !!selectedConsole;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Choisissez votre console
        </h2>
        <p className="text-gray-600">
          Sélectionnez la console que vous souhaitez réserver
        </p>
      </div>

      {/* Grille des consoles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consoles.map((console) => (
          <Card
            key={console.id}
            className={`
              cursor-pointer transition-all duration-200 hover:shadow-lg
              ${!console.available 
                ? 'opacity-50 cursor-not-allowed' 
                : selectedConsole === console.id
                  ? 'ring-2 ring-cyan-400 bg-cyan-50'
                  : 'hover:shadow-md'
              }
            `}
            onClick={() => console.available && handleConsoleSelect(console.id)}
          >
            <CardContent className="p-6">
              {/* Badge dispo */}
              <div className="flex justify-between items-start mb-4">
                {console.available ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Disponible
                  </span>
                ) : (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Indisponible
                  </span>
                )}
                
                {selectedConsole === console.id && (
                  <CheckCircle className="w-5 h-5 text-cyan-500" />
                )}
              </div>

              {/* Infos console */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{console.name}</h3>
                <p className="text-sm text-gray-600">{console.description}</p>
                {console.price && (
                  <p className="text-lg font-bold text-cyan-600">
                    {console.price}$ / heure
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section de confirmation */}
      {selectedConsole && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-800">
                  Console sélectionnée
                </h3>
              </div>
              <p className="text-green-700 mb-2">
                {consoles.find(c => c.id === selectedConsole)?.name}
              </p>
              <p className="text-sm text-green-600">
                En cliquant sur Continuer, le timer de 15 minutes démarrera 
                et vous passerez à la sélection de jeux.
              </p>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!canContinue}
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white min-w-[140px] mt-4 md:mt-0"
            >
              Continuer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Message d'aide */}
      <div className="text-center text-sm text-gray-500">
        <p>
          💡 Une fois votre choix confirmé, vous aurez 15 minutes pour finaliser votre réservation
        </p>
      </div>
    </div>
  );
}
