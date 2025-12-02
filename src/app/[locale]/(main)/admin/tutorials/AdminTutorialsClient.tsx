"use client";

import { TutorialSidebar } from "@/components/tutorial/tutorialSidebar";
import TutorialViewer from "@/components/tutorial/tutorialViewer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HeadingItem, TutorialArgs } from "@/types/docs";
import { useState } from "react";

interface AdminTutorialsClientProps {
    content: string;
    page: TutorialArgs;
}

export default function AdminTutorialsClient({
    content,
    page,
}: AdminTutorialsClientProps) {
    const [headings, setHeadings] = useState<HeadingItem[]>([]);

    return (
        <SidebarProvider className="border-t-5 border-cyan-500">
            <div className="flex min-h-screen w-full bg-gray-50">
                <TutorialSidebar headings={headings} adminRessources={true} />

                <main className="flex-1 flex flex-col w-full overflow-hidden">
                    <header className="z-10 backdrop-blur-sm shadow-sm bg-gray-800 rounded-b-lg">
                        <div className="flex items-center gap-4 px-6 py-4">
                            <SidebarTrigger
                                className="text-white hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                aria-label="Basculer le menu latéral"
                            />
                            <h1 className="text-white text-xl font-semibold">
                                {headings.length > 0 ? headings[0].text : "Tutoriel"}
                            </h1>
                        </div>
                    </header>

                    <div className="overflow-auto w-full">
                        <div className="w-full max-w-9xl mx-auto p-6 md:p-8 lg:p-12">
                            <TutorialViewer
                                page={page}
                                adminRessources={true}
                                onHeadings={setHeadings}
                                content={content}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
