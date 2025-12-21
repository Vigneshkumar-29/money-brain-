import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username?: string) => Promise<void>;
    signOut: () => Promise<void>;
    session: Session | null;
    user: any | null;
    profile: any | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    signIn: async () => { },
    signUp: async () => { },
    signOut: async () => { },
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    // Fetch user profile
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
                console.error('Error fetching profile:', error);
                return null;
            }

            setProfile(data);
            return data;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            return null;
        }
    };

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(initialSession);
                    if (initialSession?.user) {
                        await fetchProfile(initialSession.user.id);
                    }
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                if (mounted) setIsLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setSession(session);
                if (session?.user) {
                    // Update profile on auth change
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';
        const user = session?.user;

        if (!user && !inAuthGroup) {
            // Redirect to the sign-in page.
            router.replace('/auth/login');
        } else if (user && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(tabs)');
        }
    }, [session, segments, isLoading]);

    const signIn = async (email: string, password: string) => {
        // We use signInWithPassword which automatically triggers onAuthStateChange
        // But we wait for it to ensure any immediate errors are caught
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        // Success execution will be handled by onAuthStateChange listener
    };

    const signUp = async (email: string, password: string, username?: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username || email.split('@')[0],
                }
            }
        });
        if (error) throw error;

        // Create profile if user was created
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    username: username || email.split('@')[0],
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setSession(null);
    };

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signUp,
                signOut,
                session,
                user: session?.user ?? null,
                profile,
                isLoading,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
