'use client';

import { useState, useEffect } from 'react';
import { IoChatbubbleOutline, IoTimeOutline } from 'react-icons/io5';
import { auth } from '@/app/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface Conversation {
    id: string;
    title: string;
    updatedAt: Date;
}

interface ConversationSidebarProps {
    userId: string;
    currentConversationId?: string;
    onSelectConversation: (id: string) => void;
}

export default function ConversationSidebar({
    userId,
    currentConversationId,
    onSelectConversation,
}: ConversationSidebarProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadConversations() {
            try {
                const q = query(
                    collection(db, 'aiConversations'),
                    where('userId', '==', userId)
                );
                const snap = await getDocs(q);
                let convs = snap.docs.map(d => ({
                    id: d.id,
                    title: d.data().title || 'محادثة',
                    updatedAt: d.data().updatedAt?.toDate?.() || new Date(0),
                }));
                
                // Sort descending by date and limit to 30
                convs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                convs = convs.slice(0, 30);
                
                setConversations(convs);
            } catch (err) {
                console.warn('Failed to load conversations:', err);
            } finally {
                setLoading(false);
            }
        }
        loadConversations();
    }, [userId, currentConversationId]);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} د`;
        if (hours < 24) return `منذ ${hours} س`;
        if (days < 7) return `منذ ${days} أيام`;
        return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <IoChatbubbleOutline size={32} className="text-slate-300 mb-3" />
                <p className="text-sm text-slate-400">لا توجد محادثات سابقة</p>
                <p className="text-xs text-slate-300 mt-1">ابدأ محادثة جديدة!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-right px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                        currentConversationId === conv.id
                            ? 'bg-primary-50 border-r-2 border-r-primary-500'
                            : ''
                    }`}
                >
                    <p className="text-sm font-medium text-slate-700 truncate">{conv.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <IoTimeOutline size={12} className="text-slate-300" />
                        <span className="text-[10px] text-slate-400">{formatDate(conv.updatedAt)}</span>
                    </div>
                </button>
            ))}
        </div>
    );
}
