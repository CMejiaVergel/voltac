"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export function RichTextEditor({ content, onChange }: { content: string, onChange: (str: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 mx-auto w-auto max-h-[500px] object-cover',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4 text-secondary',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch("/api/upload-news-image", { method: "POST", body: formData });
          const data = await res.json();
          if (data.url) {
            editor.chain().focus().setImage({ src: data.url }).run();
          } else {
             alert(data.error || "Error subiendo imagen");
          }
        } catch (err) {
          alert("Error de red");
        }
      }
    };
    input.click();
  };

  return (
    <div className="border border-border rounded-xl bg-white overflow-hidden flex flex-col">
      <div className="bg-muted/50 border-b border-border p-2 flex flex-wrap gap-1 sticky top-0 z-10">
         <select 
           className="border border-border rounded px-2 text-sm bg-white"
           onChange={(e) => {
             const val = e.target.value;
             if (val === 'p') editor.chain().focus().setParagraph().run();
             else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
           }}>
             <option value="p">Párrafo normal</option>
             <option value="1">Título 1 (H1)</option>
             <option value="2">Título 2 (H2)</option>
             <option value="3">Título 3 (H3)</option>
         </select>
         <div className="w-px h-6 bg-border mx-1 my-auto"></div>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-primary/20 text-primary' : ''}><Bold size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-primary/20 text-primary' : ''}><Italic size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-primary/20 text-primary' : ''}><UnderlineIcon size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-primary/20 text-primary' : ''}><Strikethrough size={16}/></Button>
         <div className="w-px h-6 bg-border mx-1 my-auto"></div>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'bg-primary/20 text-primary' : ''}><AlignLeft size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'bg-primary/20 text-primary' : ''}><AlignCenter size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'bg-primary/20 text-primary' : ''}><AlignRight size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'bg-primary/20 text-primary' : ''}><AlignJustify size={16}/></Button>
         <div className="w-px h-6 bg-border mx-1 my-auto"></div>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : ''}><List size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : ''}><ListOrdered size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'bg-primary/20 text-primary' : ''}><Quote size={16}/></Button>
         <div className="w-px h-6 bg-border mx-1 my-auto"></div>
         <Button type="button" variant="ghost" size="sm" onClick={toggleLink} className={editor.isActive('link') ? 'bg-primary/20 text-primary' : ''}><LinkIcon size={16}/></Button>
         <Button type="button" variant="ghost" size="sm" onClick={addImage}><ImageIcon size={16}/></Button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px]">
         <EditorContent editor={editor} />
      </div>

    </div>
  );
}
