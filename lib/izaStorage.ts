import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const IZA_STORAGE_KEY = 'iza_session_id';

export interface IzaConversation {
    id: string;
    created_at: string;
    user_id?: string;
    fingerprint?: string;
    status: string;
}

export const getOrCreateConversation = async (userId?: string): Promise<string> => {
    // 1. Check local storage
    let sessionId = localStorage.getItem(IZA_STORAGE_KEY);

    // 2. If exists, verify if valid in DB (optional, but good for consistency)
    if (sessionId) {
        // We could verify existence here if needed, but for speed we trust local for now or handle errors on insert
        return sessionId;
    }

    // 3. Create new conversation
    sessionId = uuidv4();
    try {
        const { error } = await supabase
            .from('iza_conversations')
            .insert({
                id: sessionId,
                user_id: userId || null,
                fingerprint: 'browser-' + Math.random().toString(36).substring(7), // Simple fingerprint for now
                created_at: new Date().toISOString(),
                status: 'active'
            });

        if (error) {
            console.error('Error creating chat session:', error);
            // Fallback: still return ID to allow chat to work locally even if DB fails
        } else {
            localStorage.setItem(IZA_STORAGE_KEY, sessionId);
        }
    } catch (err) {
        console.error('Exception creating chat session:', err);
    }

    return sessionId;
};

export const saveMessageToDb = async (conversationId: string, role: 'user' | 'assistant', content: string, metadata?: any) => {
    if (!conversationId) return;

    try {
        const { error } = await supabase
            .from('iza_messages')
            .insert({
                conversation_id: conversationId,
                role,
                content,
                metadata,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error saving message:', error);
        }
    } catch (err) {
        console.error('Exception saving message:', err);
    }
};

export const updateConversationSummary = async (conversationId: string, summary: string) => {
    if (!conversationId) return;
    await supabase.from('iza_conversations').update({ summary }).eq('id', conversationId);
};
