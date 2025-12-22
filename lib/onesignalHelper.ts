import { supabase } from './supabaseClient';

/**
 * Helper to send OneSignal push notifications via Supabase Edge Function
 */
export async function sendPushNotification(title: string, message: string, userId: string, link?: string) {
    try {
        const { data, error } = await supabase.functions.invoke('onesignal-push', {
            body: { title, message, userId, link }
        });

        if (error) throw error;
        console.log("Push Notification overlap result:", data);
        return data;
    } catch (error) {
        console.error("Error sending push notification via Edge Function:", error);
        return null;
    }
}
