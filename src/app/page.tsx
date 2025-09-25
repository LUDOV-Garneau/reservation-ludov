"use client"

import Stepper from "@/components/Stepper"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"


export default function Home() {
  return(
    <div className="min-h-screen">
      <div className="m-5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Nouvelle réservation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mx-5 text-3xl decoration-cyan-400 underline underline-offset-8 md:hidden">
        <h1>Nouvelle réservation</h1>
      </div>
      <div className="mb-10">
        <Stepper/>
      </div>
      <div className="container-page">
        <h1 className="hidden md:inline-block text-4xl md:text-5xl underline underline-offset-8 decoration-3 decoration-cyan-400">Nouvelle réservation</h1>
      </div>
    </div>
  )

}
