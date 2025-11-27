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
      <div className="flex min-h-screen w-full bg-gray-50">
        <TutorialSidebar />

        <main className="flex-1 flex flex-col w-full overflow-hidden bg-[white] m-10 p-5">
          <header className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 md:px-6">
            <SidebarTrigger
              className="lg:hidden"
              aria-label="Basculer le menu latéral"
            />
          </header>

          <div className="overflow-auto w-full">
            <div className="w-full mx-auto p-4 md:p-6 lg:p-8">
              {children}
              <TutorialViewer />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
