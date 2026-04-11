/**
 * AI Token Management System
 * يدير حسابات التوكنات الداخلية مع نسبة تحويل من حقيقية
 * INTERNAL_TO_REAL_RATIO = 50 (50 internal = 1 real API token)
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    increment,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { AITokenAccount, TokenTransaction, TokenTransactionType } from '../types';

// ── Constants ──────────────────────────────────
export const INTERNAL_TO_REAL_RATIO = 50;
export const INITIAL_TOKENS = 50000;
export const MAX_TOKENS_PER_REQUEST = 2000;
export const MAX_DAILY_REQUESTS = 20;
export const LOW_BALANCE_THRESHOLD = 1000;

export const TOKEN_REWARDS = {
    initial: 50000,
    volunteer: 1000,
    course: 1000,
    referral: 500,
} as const;

// ── Conversion helpers ─────────────────────────
export function internalToReal(internal: number): number {
    return Math.ceil(internal / INTERNAL_TO_REAL_RATIO);
}

export function realToInternal(real: number): number {
    return real * INTERNAL_TO_REAL_RATIO;
}

// ── Estimate cost before sending ───────────────
export function estimateCost(messageLength: number, type: string): number {
    // Rough estimation of internal tokens
    // Input: ~1 token per 4 chars (Arabic ~1 per 2 chars)
    const inputTokens = Math.ceil(messageLength / 2);
    
    // Output estimation by type
    const outputMultipliers: Record<string, number> = {
        chat: 2,
        explain: 3,
        summarize: 1.5,
        quiz: 4,
        flashcards: 3,
        doc: 5,
        slides: 4,
        sheet: 3,
    };
    
    const multiplier = outputMultipliers[type] || 2;
    const estimatedRealTokens = inputTokens * multiplier;
    const internalCost = realToInternal(estimatedRealTokens);
    
    return Math.min(internalCost, MAX_TOKENS_PER_REQUEST);
}

// ── Get today's date string ────────────────────
function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

// ── Initialize token account ───────────────────
export async function initializeTokenAccount(
    userId: string,
    email: string,
    displayName: string
): Promise<AITokenAccount> {
    const accountRef = doc(db, 'aiTokenAccounts', userId);
    const existing = await getDoc(accountRef);
    
    if (existing.exists()) {
        return existing.data() as AITokenAccount;
    }
    
    const account: Omit<AITokenAccount, 'lastUsed' | 'createdAt'> & { lastUsed: null; createdAt: any } = {
        userId,
        email,
        displayName,
        totalTokens: INITIAL_TOKENS,
        usedTokens: 0,
        remainingTokens: INITIAL_TOKENS,
        dailyRequestCount: 0,
        dailyResetDate: getTodayString(),
        lastRenewalDate: getTodayString(),
        lastUsed: null,
        createdAt: serverTimestamp(),
        suspended: false,
    };
    
    await setDoc(accountRef, account);
    
    // Record initial grant transaction
    await addDoc(collection(db, 'aiTokenTransactions'), {
        userId,
        type: 'initial',
        amount: INITIAL_TOKENS,
        description: 'رصيد ترحيبي أولي',
        timestamp: serverTimestamp(),
    });
    
    return { ...account, createdAt: new Date() } as AITokenAccount;
}

// ── Get token balance ──────────────────────────
export async function getTokenBalance(userId: string): Promise<AITokenAccount | null> {
    const accountRef = doc(db, 'aiTokenAccounts', userId);
    const snap = await getDoc(accountRef);
    if (!snap.exists()) return null;
    
    const data = snap.data();
    const today = new Date();
    const todayStr = getTodayString();
    
    // Check for weekly renewal (every 7 days)
    const lastRenewal = data.lastRenewalDate ? new Date(data.lastRenewalDate) : (data.createdAt?.toDate?.() || today);
    const daysSinceRenewal = Math.floor((today.getTime() - lastRenewal.getTime()) / (1000 * 60 * 60 * 24));

    let needsRenewal = false;
    let renewalAmount = 0;
    if (daysSinceRenewal >= 7 || !data.lastRenewalDate) {
        const newRemaining = Math.max(data.remainingTokens, INITIAL_TOKENS);
        renewalAmount = newRemaining - data.remainingTokens;
        needsRenewal = true;
        data.remainingTokens = newRemaining;
    }

    // Reset daily count if new day OR if we need renewal
    if (data.dailyResetDate !== todayStr || needsRenewal) {
        const updates: any = {};
        if (data.dailyResetDate !== todayStr) {
            updates.dailyRequestCount = 0;
            updates.dailyResetDate = todayStr;
            data.dailyRequestCount = 0;
            data.dailyResetDate = todayStr;
        }
        if (needsRenewal) {
            updates.remainingTokens = data.remainingTokens;
            updates.lastRenewalDate = todayStr;
            data.lastRenewalDate = todayStr;
            
            if (renewalAmount > 0) {
                // We add a transaction record in firestore 
                await addDoc(collection(db, 'aiTokenTransactions'), {
                    userId,
                    type: 'admin_grant',
                    amount: renewalAmount,
                    description: 'تجديد الرصيد الأسبوعي مجاناً',
                    timestamp: serverTimestamp(),
                });
            }
        }
        await updateDoc(accountRef, updates);
    }
    
    return {
        ...data,
        lastUsed: data.lastUsed?.toDate?.() || null,
        createdAt: data.createdAt?.toDate?.() || new Date(),
    } as AITokenAccount;
}

// ── Check if user can make a request ───────────
export async function checkCanRequest(userId: string, estimatedCost: number): Promise<{
    allowed: boolean;
    reason?: string;
    balance?: number;
}> {
    const account = await getTokenBalance(userId);
    
    if (!account) {
        return { allowed: false, reason: 'لا يوجد حساب توكنات. يرجى التواصل مع الدعم.' };
    }
    
    if (account.suspended) {
        return { allowed: false, reason: 'حسابك موقوف. تواصل مع الإدارة.' };
    }
    
    if (account.remainingTokens < estimatedCost) {
        return {
            allowed: false,
            reason: 'رصيد التوكنات غير كافٍ. اكسب المزيد من خلال التطوع أو الكورسات!',
            balance: account.remainingTokens,
        };
    }
    
    if (account.dailyRequestCount >= MAX_DAILY_REQUESTS) {
        return {
            allowed: false,
            reason: `وصلت للحد اليومي (${MAX_DAILY_REQUESTS} طلب). حاول غداً!`,
            balance: account.remainingTokens,
        };
    }
    
    return { allowed: true, balance: account.remainingTokens };
}

// ── Deduct tokens after API call ───────────────
export async function deductTokens(
    userId: string,
    amount: number,
    description: string
): Promise<void> {
    const accountRef = doc(db, 'aiTokenAccounts', userId);
    
    await updateDoc(accountRef, {
        usedTokens: increment(amount),
        remainingTokens: increment(-amount),
        dailyRequestCount: increment(1),
        lastUsed: serverTimestamp(),
    });
    
    // Record transaction
    await addDoc(collection(db, 'aiTokenTransactions'), {
        userId,
        type: 'usage',
        amount: -amount,
        description,
        timestamp: serverTimestamp(),
    });
}

// ── Add tokens (reward) ────────────────────────
export async function addTokens(
    userId: string,
    amount: number,
    type: TokenTransactionType,
    description: string,
    referenceId?: string
): Promise<void> {
    const accountRef = doc(db, 'aiTokenAccounts', userId);
    const snap = await getDoc(accountRef);
    
    if (!snap.exists()) return;
    
    await updateDoc(accountRef, {
        totalTokens: increment(amount),
        remainingTokens: increment(amount),
    });
    
    // Record transaction
    await addDoc(collection(db, 'aiTokenTransactions'), {
        userId,
        type,
        amount,
        description,
        timestamp: serverTimestamp(),
        ...(referenceId ? { referenceId } : {}),
    });
}

// ── Get token history (paginated) ──────────────
export async function getTokenHistory(
    userId: string, 
    limitCount: number = 20
): Promise<TokenTransaction[]> {
    const q = query(
        collection(db, 'aiTokenTransactions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.() || new Date(),
    })) as TokenTransaction[];
}

// ── Admin: Get all token accounts ──────────────
export async function getAllTokenAccounts(): Promise<AITokenAccount[]> {
    const snap = await getDocs(collection(db, 'aiTokenAccounts'));
    return snap.docs.map(d => ({
        ...d.data(),
        lastUsed: d.data().lastUsed?.toDate?.() || null,
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
    })) as AITokenAccount[];
}

// ── Admin: Grant tokens to user ────────────────
export async function adminGrantTokens(
    userId: string,
    amount: number,
    reason: string
): Promise<void> {
    await addTokens(userId, amount, 'admin_grant', reason);
}

// ── Admin: Suspend/unsuspend user ──────────────
export async function adminToggleSuspend(userId: string, suspend: boolean): Promise<void> {
    const accountRef = doc(db, 'aiTokenAccounts', userId);
    await updateDoc(accountRef, { suspended: suspend });
}
