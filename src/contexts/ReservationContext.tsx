"use client"

// import {ReservationProvider} from "../contexts/ReservationContext";
// wrapper le layout du flow de réservation avec ReservationProvider
// et utiliser le context dans les pages du flow de réservation pour gérer le timer

import { createContext, useContext, useState, useEffect } from "react"

interface ReservationContextType {
  selectedConsole: { id: string; name: string; image: string } | null
  expirationTime: number | null
  timeLeft: string
  startReservation: (console: { id: string; name: string; image: string }) => void
  endReservation: () => void
}

const ReservationContext = createContext<ReservationContextType | null>(null)

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [selectedConsole, setSelectedConsole] = useState<ReservationContextType["selectedConsole"]>(null)
  const [expirationTime, setExpirationTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    if (!expirationTime) return
    const interval = setInterval(() => {
      const diff = expirationTime - Date.now()
      if (diff <= 0) {
        setSelectedConsole(null)
        setExpirationTime(null)
        setTimeLeft("")
        clearInterval(interval)
      } else {
        const min = Math.floor(diff / 60000)
        const sec = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expirationTime])

  const startReservation = (console: { id: string; name: string; image: string }) => {
    setSelectedConsole(console)
    setExpirationTime(Date.now() + 15 * 60 * 1000)
  }

  const endReservation = () => {
    setSelectedConsole(null)
    setExpirationTime(null)
    setTimeLeft("")
  }

  return (
    <ReservationContext.Provider value={{ selectedConsole, expirationTime, timeLeft, startReservation, endReservation }}>
      {children}
    </ReservationContext.Provider>
  )
}

export function useReservation() {
  const ctx = useContext(ReservationContext)
  if (!ctx) throw new Error("useReservation must be used inside ReservationProvider")
  return ctx
}

