import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userProfile: any | null;
    role: string | null;
    emailVerified: boolean; // True if email has been confirmed
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [emailVerified, setEmailVerified] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            // Check if email is verified
            setEmailVerified(!!session?.user?.email_confirmed_at);
            if (session?.user) {
                fetchUserData(session.user.id, session.user.email);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            // Check if email is verified
            setEmailVerified(!!session?.user?.email_confirmed_at);
            if (session?.user) {
                fetchUserData(session.user.id, session.user.email);
            } else {
                setRole(null);
                setUserProfile(null);
                setEmailVerified(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserData = async (userId: string, email?: string) => {
        try {
            const { data, error } = await supabase
                .from('perfis')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setUserProfile(data);
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
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setRole('Corretor'); // Safe default
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, userProfile, role, emailVerified, loading, signOut }}>
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
