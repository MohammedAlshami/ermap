'use client';

import React, { useEffect, useRef } from 'react';
import { useEditor, Tiptap } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content…',
  className = '',
  minHeight = '120px',
}: RichTextEditorProps) {
  const lastEmittedRef = useRef<string | null>(null);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor(
    {
      extensions: [StarterKit],
      content: value || '<p></p>',
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] px-3 py-2',
        },
        handleDOMEvents: {
          blur: () => {
            const ed = editorRef.current;
            if (ed) onChange(ed.getHTML());
          },
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        lastEmittedRef.current = html;
        onChange(html);
      },
    },
    [] // keep editor instance stable; do not depend on value
  );

  editorRef.current = editor;

  // Sync external value into editor only when it didn't come from us (e.g. user switched slide)
  useEffect(() => {
    if (!editor) return;
    if (lastEmittedRef.current === value) {
      lastEmittedRef.current = null;
      return;
    }
    const current = editor.getHTML();
    const normalizedValue = value || '<p></p>';
    if (normalizedValue !== current) {
      editor.commands.setContent(normalizedValue, false);
    }
  }, [editor, value]);

  return (
    <div
      className={`rounded-lg border border-input bg-background overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      <Tiptap instance={editor}>
        <Tiptap.Content />
      </Tiptap>
    </div>
  );
}
