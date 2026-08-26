"use client";

import { TutorialSidebar } from "@/components/tutorial/tutorialSidebar";
import TutorialViewer from "@/components/tutorial/tutorialViewer";
import DocEditor, {
    type DocEditorApi,
} from "@/components/admin/tutorials/DocEditor";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { HeadingItem, TutorialArgs } from "@/types/docs";
import { Loader2, Pencil, PencilOff } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useState } from "react";

interface AdminTutorialsClientProps {
    content: string;
    page: TutorialArgs;
}

export default function AdminTutorialsClient({
    content,
    page,
}: AdminTutorialsClientProps) {
    const locale = useLocale();
    const [headings, setHeadings] = useState<HeadingItem[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    // Le guide Markdown est une aide de référence, pas une page de contenu :
    // il n'est pas éditable depuis l'admin.
    const isEditable = page !== TutorialArgs.MARKDOWN_GUIDE;
    // Alimenté par l'éditeur : permet d'enregistrer depuis l'en-tête.
    const [editorApi, setEditorApi] = useState<DocEditorApi | null>(null);

    // Stable : l'éditeur publie son API dans un effet qui dépend de ce
    // callback. Une fonction recréée à chaque rendu relancerait l'effet, donc
    // un setState parent, donc un rendu… en boucle.
    const handleSaved = useCallback(
        (savedLocale: "fr" | "en", savedContent: string) => {
            if (savedLocale === locale || savedLocale === "fr") {
                setDisplayedContent(savedContent);
            }
            setIsEditing(false);
        },
        [locale]
    );
    // Contenu affiché : mis à jour immédiatement après une sauvegarde.
    const [displayedContent, setDisplayedContent] = useState(content);

    return (
        <SidebarProvider className="border-t-5 border-cyan-500">
            <div className="flex min-h-screen w-full bg-white">
                <TutorialSidebar headings={headings} adminRessources={true} />

                <main className="flex-1 flex flex-col w-full overflow-hidden">
                    <header className="z-10 backdrop-blur-sm shadow-sm bg-gray-800 rounded-b-lg">
                        <div className="flex items-center gap-4 px-6 py-4">
                            <SidebarTrigger
                                className="text-white hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                aria-label="Basculer le menu latéral"
                            />
                            <h1 className="text-white text-xl font-semibold flex-1">
                                {headings.length > 0 ? headings[0].text : "Tutoriel"}
                            </h1>
                            {!isEditable ? null : isEditing ? (
                                <>
                                    <Button
                                        onClick={() => setIsEditing(false)}
                                        className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                                        size="sm"
                                    >
                                        <PencilOff className="h-4 w-4" />
                                        Arrêter l&apos;édition
                                    </Button>
                                    <Button
                                        onClick={() => editorApi?.save()}
                                        disabled={
                                            !editorApi?.canSave || editorApi?.isSaving
                                        }
                                        className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                                        size="sm"
                                    >
                                        {editorApi?.isSaving && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                        Enregistrer
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                                    size="sm"
                                >
                                    <Pencil className="h-4 w-4" />
                                    Éditer
                                </Button>
                            )}
                        </div>
                    </header>

                    <div className="overflow-auto w-full">
                        <div className="w-full max-w-9xl mx-auto p-6 md:p-8 lg:p-12">
                            {isEditing && isEditable ? (
                                <DocEditor
                                    slug={page}
                                    onApiChange={setEditorApi}
                                    onSaved={handleSaved}
                                />
                            ) : (
                                <TutorialViewer
                                    page={page}
                                    adminRessources={true}
                                    onHeadings={setHeadings}
                                    content={displayedContent}
                                />
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
