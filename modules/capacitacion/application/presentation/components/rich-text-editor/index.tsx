'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote'],
  ['clean'],
];

interface IRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 200 }: IRichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor .ql-container { min-height: ${minHeight}px; font-size: 0.875rem; font-family: inherit; border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem; }
        .rich-text-editor .ql-toolbar { border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem; background: hsl(var(--muted) / 0.4); }
        .rich-text-editor .ql-editor { min-height: ${minHeight}px; }
        .rich-text-editor .ql-editor.ql-blank::before { color: hsl(var(--muted-foreground)); font-style: normal; }
        .rich-text-editor .ql-container, .rich-text-editor .ql-toolbar { border-color: hsl(var(--border)); }
        .dark .rich-text-editor .ql-toolbar { background: hsl(var(--muted) / 0.3); }
        .dark .rich-text-editor .ql-toolbar .ql-stroke { stroke: hsl(var(--foreground) / 0.7); }
        .dark .rich-text-editor .ql-toolbar .ql-fill { fill: hsl(var(--foreground) / 0.7); }
        .dark .rich-text-editor .ql-toolbar .ql-picker { color: hsl(var(--foreground) / 0.7); }
        .dark .rich-text-editor .ql-editor { color: hsl(var(--foreground)); background: hsl(var(--background)); }
        .dark .rich-text-editor .ql-container { background: hsl(var(--background)); }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR }}
      />
    </div>
  );
}
