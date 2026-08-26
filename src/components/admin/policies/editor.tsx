// components/admin/policies/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImageIcon
} from 'lucide-react';

interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

/** Saisie d'URL pour les boutons « lien » et « image » de la barre d'outils. */
const URL_DIALOG = {
  link: {
    title: 'Ajouter un lien',
    description: 'Le texte sélectionné deviendra un lien vers cette adresse.',
    label: 'Adresse du lien',
    placeholder: 'https://exemple.com',
    submit: 'Insérer le lien',
  },
  image: {
    title: 'Ajouter une image',
    description: "L'image sera insérée à l'endroit du curseur.",
    label: "Adresse de l'image",
    placeholder: '/api/admin/images/dossier/fichier.png',
    submit: "Insérer l'image",
  },
} as const;

type UrlDialogMode = keyof typeof URL_DIALOG;

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  // Dialogue applicatif plutôt que window.prompt : même présentation que le
  // reste du site, et le focus reste dans la page.
  const [urlDialog, setUrlDialog] = useState<UrlDialogMode | null>(null);
  const [url, setUrl] = useState('');

  if (!editor) return null;

  const openLinkDialog = () => {
    // Pré-remplit avec le lien existant quand le curseur est déjà dessus.
    setUrl(editor.getAttributes('link').href ?? '');
    setUrlDialog('link');
  };

  const openImageDialog = () => {
    setUrl('');
    setUrlDialog('image');
  };

  const submitUrl = (event: React.FormEvent) => {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;

    if (urlDialog === 'link') {
      editor.chain().focus().setLink({ href: value }).run();
    } else {
      editor.chain().focus().setImage({ src: value }).run();
    }
    setUrlDialog(null);
    setUrl('');
  };

  return (
    <div className="flex flex-wrap gap-1 border-b p-2 bg-gray-50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bold') ? 'bg-gray-300' : ''
        }`}
        title="Gras (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('italic') ? 'bg-gray-300' : ''
        }`}
        title="Italique (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('underline') ? 'bg-gray-300' : ''
        }`}
        title="Souligné (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('strike') ? 'bg-gray-300' : ''
        }`}
        title="Barré"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
        }`}
        title="Titre 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
        }`}
        title="Titre 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('bulletList') ? 'bg-gray-300' : ''
        }`}
        title="Liste à puces"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('orderedList') ? 'bg-gray-300' : ''
        }`}
        title="Liste numérotée"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('blockquote') ? 'bg-gray-300' : ''
        }`}
        title="Citation"
      >
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={openLinkDialog}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive('link') ? 'bg-gray-300' : ''
        }`}
        title="Ajouter un lien"
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={openImageDialog}
        className="p-2 rounded hover:bg-gray-200"
        title="Ajouter une image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
        title="Annuler (Ctrl+Z)"
      >
        <Undo className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
        title="Refaire (Ctrl+Y)"
      >
        <Redo className="w-4 h-4" />
      </button>

      <Dialog
        open={urlDialog !== null}
        onOpenChange={(open) => !open && setUrlDialog(null)}
      >
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden">
          <div className="border-b px-6 py-4 bg-gray-50">
            <DialogTitle className="text-lg text-gray-900">
              {URL_DIALOG[urlDialog ?? 'link'].title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              {URL_DIALOG[urlDialog ?? 'link'].description}
            </DialogDescription>
          </div>

          <form onSubmit={submitUrl} className="px-6 pb-5 pt-5 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="editor-url" className="font-semibold">
                {URL_DIALOG[urlDialog ?? 'link'].label}
              </Label>
              <Input
                id="editor-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder={URL_DIALOG[urlDialog ?? 'link'].placeholder}
                autoFocus
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto hover:bg-gray-50"
                onClick={() => setUrlDialog(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!url.trim()}
                className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600"
              >
                {URL_DIALOG[urlDialog ?? 'link'].submit}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Écrivez quelque chose...'
}: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none',
      },
    },
  });

  return (
    <div className="border rounded-lg overflow-hidden bg-[white]">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}