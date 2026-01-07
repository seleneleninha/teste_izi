import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

interface TourContextType {
    showTour: boolean;
    onboardingCompleted: boolean;
    startTour: () => void;
    completeTour: () => void;
    skipTour: () => void;
    hasPremiumPlan: boolean;
    userSlug: string;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    showMobileWelcome: boolean;
    closeMobileWelcome: () => void;
    userName: string;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Premium plan IDs
const PREMIUM_PLAN_IDS = [
    '55de4ee5-c2f1-4f9d-b466-7e08138854f0', // Avançado
    'edf90163-d554-4f8e-bfe9-7d9e98fc4450'  // Profissional
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [showTour, setShowTour] = useState(false);
    const [showMobileWelcome, setShowMobileWelcome] = useState(false);
    const [onboardingCompleted, setOnboardingCompleted] = useState(true);
    const [userPlanoId, setUserPlanoId] = useState<string | null>(null);
    const [userSlug, setUserSlug] = useState('');
    const [userName, setUserName] = useState('');
    const [currentStep, setCurrentStep] = useState(0);

    const hasPremiumPlan = userPlanoId ? PREMIUM_PLAN_IDS.includes(userPlanoId) : false;

    // Fetch onboarding status on mount
    useEffect(() => {
        const fetchOnboardingStatus = async () => {
            if (!user) return;

            try {
                const { data } = await supabase
                    .from('perfis')
                    .select('onboarding_completed, plano_id, slug')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setOnboardingCompleted(data.onboarding_completed || false);
                    setUserPlanoId(data.plano_id || null);
                    setUserSlug(data.slug || '');
                    setUserName(data.nome || '');

                    // Show welcome modal for first-time users (mobile AND desktop)
                    if (!data.onboarding_completed) {
                        setShowMobileWelcome(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching onboarding status:', error);
            }
        };

        fetchOnboardingStatus();
    }, [user]);

    const startTour = useCallback(() => {
        setCurrentStep(0); // Reset to first step
        setShowTour(true);
    }, []);

    const completeTour = useCallback(async () => {
        setShowTour(false);

        if (!user) return;

        try {
            await supabase
                .from('perfis')
                .update({
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            setOnboardingCompleted(true);
        } catch (error) {
            console.error('Error completing tour:', error);
        }
    }, [user]);

    const skipTour = useCallback(async () => {
        setShowTour(false);

        if (!user) return;

        try {
            await supabase
                .from('perfis')
                .update({
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            setOnboardingCompleted(true);
        } catch (error) {
            console.error('Error skipping tour:', error);
        }
    }, [user]);

    const closeMobileWelcome = useCallback(async () => {
        setShowMobileWelcome(false);

        if (!user) return;

        try {
            await supabase
                .from('perfis')
                .update({
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            setOnboardingCompleted(true);
        } catch (error) {
            console.error('Error closing mobile welcome:', error);
        }
    }, [user]);

    return (
        <TourContext.Provider value={{
            showTour,
            onboardingCompleted,
            startTour,
            completeTour,
            skipTour,
            hasPremiumPlan,
            userSlug,
            currentStep,
            setCurrentStep,
            showMobileWelcome,
            closeMobileWelcome,
            userName
        }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};
