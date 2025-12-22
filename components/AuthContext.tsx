import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- OneSignal Sync Helper ---
        const syncOneSignal = (userId: string | undefined) => {
            const OneSignalDeferred = (window as any).OneSignalDeferred || [];
            (window as any).OneSignalDeferred = OneSignalDeferred;

            OneSignalDeferred.push(async (OneSignal: any) => {
                try {
                    if (userId) {
                        console.log("OneSignal: syncing user...", userId);
                        await OneSignal.login(userId);

                        // Diagnostics para v16
                        const permission = OneSignal.Notifications.permission;
                        const subId = OneSignal.User.PushSubscription.id;
                        console.log(`OneSignal v16 Diagnostics: Permission=${permission}, SubID=${subId || 'none'}`);

                        console.log("OneSignal: External ID synced successfully");
                    } else {
                        console.log("OneSignal: logging out...");
                        await OneSignal.logout();
                    }
                } catch (err) {
                    console.warn("OneSignal sync error:", err);
                }
            });
        };

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id, session.user.email);
                syncOneSignal(session.user.id);
            } else {
                setLoading(false);
                syncOneSignal(undefined);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserRole(session.user.id, session.user.email);
                syncOneSignal(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
                syncOneSignal(undefined);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('perfis')
                .select('is_admin, tipo_usuario')
                .eq('id', userId)
                .single();

            if (data) {
                // Use is_admin column to determine role
                if (data.is_admin) {
                    setRole('Admin');
                } else if (data.tipo_usuario === 'cliente') {
                    setRole('Cliente');
                } else {
                    setRole('Corretor');
                }
            } else {
                // Default to Corretor if profile not found
                setRole('Corretor');
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            setRole('Corretor'); // Safe default
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
