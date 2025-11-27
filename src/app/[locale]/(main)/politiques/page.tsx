"use client";

import { TutorialSidebar } from "@/components/tutorial/tutorialSidebar";
import TutorialViewer from "@/components/tutorial/tutorialViewer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface TutorialPageProps {
  children: React.ReactNode;
}

export default function TutorialPage({ children }: TutorialPageProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <TutorialSidebar />

        <main className="flex-1 flex flex-col w-full overflow-hidden">
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 md:px-6">
            <SidebarTrigger
              className="lg:hidden"
              aria-label="Basculer le menu latéral"
            />
            <h1 className="text-2xl font-bold">Tutoriel</h1>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6 lg:p-8">
              {children}
              <TutorialViewer />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
