'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSendOutline,
    IoSparklesOutline,
    IoPersonCircleOutline,
    IoAlertCircleOutline,
    IoCopyOutline,
    IoCheckmarkOutline,
    IoDocumentTextOutline,
    IoEaselOutline,
    IoRefreshOutline,
} from 'react-icons/io5';
import StudyModes from './StudyModes';
import VoiceRecorder from './VoiceRecorder';
import FileAttachment from './FileAttachment';
import PreviewCard from './PreviewCard';
import { StudyMode } from '@/app/types';
import { auth } from '@/app/lib/firebase';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type: StudyMode;
    structuredData?: any;
    tokensUsed?: number;
    timestamp: Date;
    attachments?: string[];
}

interface AIChatPanelProps {
    userId: string;
    userDisplayName: string;
    conversationId?: string;
    onConversationCreated: (id: string) => void;
    onTokenUpdate: (balance: number, dailyCount: number) => void;
}

export default function AIChatPanel({
    userId,
    userDisplayName,
    conversationId,
    onConversationCreated,
    onTokenUpdate,
}: AIChatPanelProps) {
    const [activeMode, setActiveMode] = useState<StudyMode | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset or load messages when conversation changes
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        async function fetchMessages() {
            try {
                const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/app/lib/firebase');

                const currentConvMessagesRef = collection(db, 'aiConversations', conversationId!, 'messages');
                const q = query(currentConvMessagesRef, orderBy('timestamp', 'asc'));

                const snapshot = await getDocs(q);
                if (!isMounted) return;

                const loadedMessages: Message[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        role: data.role as 'user' | 'assistant',
                        content: data.content || '',
                        type: data.type || 'chat',
                        structuredData: data.structuredData || null,
                        tokensUsed: data.tokensUsed || undefined,
                        timestamp: data.timestamp?.toDate() || new Date(),
                        attachments: data.attachments || undefined,
                    };
                });

                setMessages(loadedMessages);
            } catch (err) {
                console.error("Failed to fetch messages:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchMessages();

        return () => { isMounted = false; };
    }, [conversationId]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const sendMessage = useCallback(async (messageText: string, type: StudyMode = 'chat', imageAttachments?: string[]) => {
        if (!messageText.trim() && !imageAttachments?.length) return;
        setError(null);

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            type,
            timestamp: new Date(),
            attachments: imageAttachments,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        setIsLoading(true);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error('غير مصرح');

            // Build conversation history from current messages (last 10 for context)
            const conversationHistory = messages.slice(-10).map(m => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type,
                    message: messageText,
                    attachments: imageAttachments,
                    conversationId,
                    conversationHistory,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.type === 'token_error') {
                    setError(data.error);
                    if (data.balance !== undefined) {
                        onTokenUpdate(data.balance, 0);
                    }
                } else {
                    setError(data.error || 'حدث خطأ. حاول مرة أخرى.');
                }
                return;
            }

            const assistantMsg: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.content,
                type: data.type,
                structuredData: data.structuredData,
                tokensUsed: data.tokensUsed,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);

            // Update conversation ID
            if (data.conversationId && !conversationId) {
                onConversationCreated(data.conversationId);
            }

            // Update token balance
            if (data.balance !== undefined) {
                onTokenUpdate(data.balance, 0);
            }
        } catch (err: any) {
            setError(err.message || 'خطأ في الاتصال');
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, onConversationCreated, onTokenUpdate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || (!input.trim() && attachments.length === 0)) return;
        sendMessage(input, activeMode || 'chat', attachments.length > 0 ? attachments : undefined);
    };

    const handleStudyMode = (mode: StudyMode, prefix?: string) => {
        setActiveMode(mode);
        if (input.trim()) {
            sendMessage(input, mode);
        } else {
            inputRef.current?.focus();
        }
    };

    const handleVoiceResult = (text: string) => {
        setInput(text);
        inputRef.current?.focus();
    };

    const handleImageAttach = (base64: string) => {
        setAttachments(prev => [...prev, base64]);
    };

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mb-5"
                        >
                            <IoSparklesOutline size={32} className="text-primary-600" />
                        </motion.div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">
                            أهلاً {userDisplayName}! 👋
                        </h2>
                        <p className="text-sm text-slate-500 max-w-sm">
                            أنا مساعد الدراسة الذكي. اسألني أي سؤال، أو استخدم أوضاع الدراسة أدناه!
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-6 max-w-sm">
                            {[
                                { text: 'اشرحلي الفوتوسنثيسس', mode: 'explain' as StudyMode },
                                { text: 'لخصلي الحرب العالمية الثانية', mode: 'summarize' as StudyMode },
                                { text: 'اعملي اختبار عن الفيزياء', mode: 'quiz' as StudyMode },
                                { text: 'اعملي ملف docs عن البرمجة', mode: 'doc' as StudyMode },
                            ].map((suggestion) => (
                                <motion.button
                                    key={suggestion.text}
                                    onClick={() => sendMessage(suggestion.text, suggestion.mode)}
                                    className="text-xs text-right p-3 bg-white rounded-xl border border-slate-100 text-slate-600 hover:border-primary-200 hover:text-primary-700 transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {suggestion.text}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user'
                                    ? 'bg-primary-100'
                                    : 'bg-gradient-to-br from-violet-100 to-purple-200'
                                }`}>
                                {msg.role === 'user'
                                    ? <IoPersonCircleOutline size={20} className="text-primary-600" />
                                    : <IoSparklesOutline size={18} className="text-purple-600" />
                                }
                            </div>

                            {/* Content */}
                            <div className={`max-w-[80%] sm:max-w-[70%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-md'
                                        : 'bg-white border border-slate-100 shadow-sm text-slate-800 rounded-tl-md'
                                    }`}>
                                    {/* Image attachments */}
                                    {msg.attachments?.map((att, i) => (
                                        <img
                                            key={i}
                                            src={att}
                                            alt="مرفق"
                                            className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                                        />
                                    ))}

                                    {/* Text content */}
                                    <div
                                        className="text-sm leading-relaxed whitespace-pre-wrap"
                                        dir="auto"
                                    >
                                        {msg.structuredData ? '' : msg.content}
                                    </div>

                                    {/* Structured data preview */}
                                    {msg.structuredData && (
                                        <PreviewCard
                                            data={msg.structuredData}
                                            type={msg.type}
                                        />
                                    )}
                                </div>

                                {/* Message actions */}
                                {msg.role === 'assistant' && !msg.structuredData && (
                                    <div className="flex items-center flex-wrap gap-3 mt-2 mr-1">
                                        <button
                                            onClick={() => handleCopy(msg.content, msg.id)}
                                            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                                        >
                                            {copiedId === msg.id
                                                ? <><IoCheckmarkOutline size={14} className="text-green-500" /> تم النسخ</>
                                                : <><IoCopyOutline size={14} /> نسخ</>
                                            }
                                        </button>
                                        <button
                                            onClick={() => sendMessage(`قم بإنشاء مستند عن: \n${msg.content.substring(0, 300)}...`, 'doc')}
                                            className="text-[11px] font-medium text-slate-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
                                        >
                                            <IoDocumentTextOutline size={14} />
                                            تحويل لمستند
                                        </button>
                                        <button
                                            onClick={() => sendMessage(`قم بإنشاء عرض تقديمي عن: \n${msg.content.substring(0, 300)}...`, 'slides')}
                                            className="text-[11px] font-medium text-slate-400 hover:text-orange-600 flex items-center gap-1 transition-colors"
                                        >
                                            <IoEaselOutline size={14} />
                                            تحويل لعرض
                                        </button>
                                        <button
                                            onClick={() => {
                                                const lastUserMsg = messages.slice(0, messages.findIndex(m => m.id === msg.id)).reverse().find(m => m.role === 'user');
                                                if (lastUserMsg) {
                                                    sendMessage(lastUserMsg.content, msg.type, lastUserMsg.attachments);
                                                }
                                            }}
                                            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                                        >
                                            <IoRefreshOutline size={14} />
                                            إعادة توليد
                                        </button>
                                        {msg.tokensUsed && (
                                            <span className="text-[10px] text-slate-300 mr-auto">
                                                {msg.tokensUsed} توكن
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2.5"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center">
                            <IoSparklesOutline size={18} className="text-purple-600" />
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Error message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm"
                    >
                        <IoAlertCircleOutline size={18} />
                        {error}
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Study Modes */}
            <div className="px-3 sm:px-6">
                <StudyModes
                    activeMode={activeMode}
                    onClearMode={() => setActiveMode(null)}
                    onSelectMode={handleStudyMode}
                    disabled={isLoading}
                    hasInput={input.trim().length > 0}
                />
            </div>

            {/* Attachment Preview */}
            {attachments.length > 0 && (
                <div className="px-3 sm:px-6 py-2 flex gap-2 overflow-x-auto">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative flex-shrink-0">
                            <img src={att} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                            <button
                                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="px-3 sm:px-6 pb-3 sm:pb-4">
                <div className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm px-3 py-2 focus-within:border-primary-300 focus-within:shadow-md transition-all">
                    <VoiceRecorder onResult={handleVoiceResult} onUpdate={handleVoiceResult} disabled={isLoading} />
                    <FileAttachment onAttach={handleImageAttach} disabled={isLoading} />

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={
                            attachments.length > 0 ? 'اكتب سؤالك عن الصورة أو اضغط إرسال لحل الأسئلة...'
                                : activeMode === 'doc' ? 'اكتب موضوع المستند (مثال: الذكاء الاصطناعي)...'
                                    : activeMode === 'slides' ? 'اكتب موضوع العرض التقديمي...'
                                        : activeMode === 'explain' ? 'اكتب ما تريد شرحه...'
                                            : activeMode === 'quiz' ? 'اكتب موضوع الاختبار...'
                                                : activeMode === 'summarize' ? 'اكتب النص المراد تلخيصه...'
                                                    : activeMode === 'flashcards' ? 'اكتب موضوع البطاقات...'
                                                        : '...اكتب سؤالك هنا'
                        }
                        disabled={isLoading}
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 border-none outline-none py-1.5 max-h-28 min-h-[36px]"
                        dir="auto"
                    />

                    <motion.button
                        type="submit"
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        className="w-9 h-9 bg-primary-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <IoSendOutline size={18} className="rotate-180" />
                    </motion.button>
                </div>
            </form>
        </div>
    );
}
