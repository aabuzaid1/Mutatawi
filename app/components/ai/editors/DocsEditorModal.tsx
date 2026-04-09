'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import {
    IoClose,
    IoDownloadOutline,
    IoCodeOutline,
} from 'react-icons/io5';
import {
    LuBold,
    LuItalic,
    LuUnderline,
    LuStrikethrough,
    LuHeading1,
    LuHeading2,
    LuHeading3,
    LuList,
    LuListOrdered,
    LuAlignRight,
    LuAlignCenter,
    LuAlignLeft,
    LuUndo2,
    LuRedo2,
} from 'react-icons/lu';
import { AIDocOutput } from '@/app/types';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface DocsEditorModalProps {
    data: AIDocOutput;
    onClose: () => void;
}

function docToHtml(doc: AIDocOutput): string {
    let html = `<h1>${doc.title}</h1>`;
    for (const section of doc.sections) {
        html += `<h2>${section.heading}</h2>`;
        // Split content by newlines into paragraphs
        const paragraphs = section.content.split('\n').filter(p => p.trim());
        for (const p of paragraphs) {
            html += `<p>${p}</p>`;
        }
    }
    return html;
}

export default function DocsEditorModal({ data, onClose }: DocsEditorModalProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
        ],
        content: docToHtml(data),
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[60vh] px-6 sm:px-10 py-6 text-right',
                dir: 'rtl',
            },
        },
    });

    const downloadDocx = useCallback(async () => {
        if (!editor) return;

        // Build DOCX from editor JSON content
        const json = editor.getJSON();
        const paragraphs: Paragraph[] = [];

        function processNode(node: any) {
            if (node.type === 'heading') {
                const text = node.content?.map((c: any) => c.text || '').join('') || '';
                const level = node.attrs?.level === 1
                    ? HeadingLevel.HEADING_1
                    : node.attrs?.level === 2
                        ? HeadingLevel.HEADING_2
                        : HeadingLevel.HEADING_3;
                paragraphs.push(new Paragraph({
                    text,
                    heading: level,
                    bidirectional: true,
                    alignment: AlignmentType.RIGHT,
                }));
            } else if (node.type === 'paragraph') {
                const runs: TextRun[] = [];
                if (node.content) {
                    for (const child of node.content) {
                        const marks = child.marks || [];
                        runs.push(new TextRun({
                            text: child.text || '',
                            bold: marks.some((m: any) => m.type === 'bold'),
                            italics: marks.some((m: any) => m.type === 'italic'),
                            underline: marks.some((m: any) => m.type === 'underline')
                                ? {} : undefined,
                            strike: marks.some((m: any) => m.type === 'strike'),
                            rightToLeft: true,
                        }));
                    }
                }
                paragraphs.push(new Paragraph({
                    children: runs.length > 0 ? runs : [new TextRun('')],
                    bidirectional: true,
                    alignment: AlignmentType.RIGHT,
                }));
            } else if (node.type === 'bulletList' || node.type === 'orderedList') {
                node.content?.forEach((item: any) => {
                    const text = item.content?.[0]?.content?.map((c: any) => c.text || '').join('') || '';
                    paragraphs.push(new Paragraph({
                        text: `• ${text}`,
                        bidirectional: true,
                        alignment: AlignmentType.RIGHT,
                    }));
                });
            }
        }

        json.content?.forEach(processNode);

        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs,
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${data.title || 'document'}.docx`);
    }, [editor, data.title]);

    const downloadPdf = useCallback(() => {
        if (!editor) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const htmlContent = editor.getHTML();
        
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>${data.title || 'مستند'}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 40px;
                        direction: rtl;
                        text-align: right;
                        color: #000;
                    }
                    h1 { font-size: 24px; margin-bottom: 20px; }
                    h2 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; }
                    h3 { font-size: 16px; margin-top: 15px; margin-bottom: 10px; }
                    p { line-height: 1.6; font-size: 14px; margin-bottom: 10px; }
                    ul, ol { margin-right: 20px; margin-bottom: 10px; }
                    li { margin-bottom: 5px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }, [editor, data.title]);

    if (!editor) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-stretch"
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full bg-white flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                            <IoClose size={22} />
                        </button>
                        <h2 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                            {data.title || 'مستند'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadPdf}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                        >
                            <IoDownloadOutline size={16} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={downloadDocx}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors"
                        >
                            <IoDownloadOutline size={16} />
                            <span className="hidden sm:inline">DOCX</span>
                            <span className="sm:hidden">تحميل</span>
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-2 sm:px-4 py-2 border-b border-slate-100 overflow-x-auto bg-slate-50">
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="غامق">
                        <LuBold size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="مائل">
                        <LuItalic size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="تسطير">
                        <LuUnderline size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="خط وسطي">
                        <LuStrikethrough size={16} />
                    </ToolbarBtn>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="عنوان 1">
                        <LuHeading1 size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="عنوان 2">
                        <LuHeading2 size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="عنوان 3">
                        <LuHeading3 size={16} />
                    </ToolbarBtn>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="قائمة نقطية">
                        <LuList size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="قائمة مرقمة">
                        <LuListOrdered size={16} />
                    </ToolbarBtn>

                    <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

                    <span className="hidden sm:contents">
                        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="محاذاة يمين">
                            <LuAlignRight size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="محاذاة وسط">
                            <LuAlignCenter size={16} />
                        </ToolbarBtn>
                        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="محاذاة يسار">
                            <LuAlignLeft size={16} />
                        </ToolbarBtn>
                    </span>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="كود">
                        <IoCodeOutline size={16} />
                    </ToolbarBtn>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="تراجع">
                        <LuUndo2 size={16} />
                    </ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="إعادة">
                        <LuRedo2 size={16} />
                    </ToolbarBtn>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ToolbarBtn({ onClick, active, title, children }: {
    onClick: () => void;
    active: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2 rounded-lg transition-colors ${
                active ? 'bg-primary-100 text-primary-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
        >
            {children}
        </button>
    );
}
