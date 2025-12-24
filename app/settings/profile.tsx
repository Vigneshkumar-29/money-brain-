import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, User, Mail, Save } from 'lucide-react-native';
import FadeInView from '../../components/ui/FadeInView';

export default function ProfileSettings() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user]);

    async function getProfile() {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            const { data, error, status } = await supabase
                .from('profiles')
                .select(`username`)
                .eq('id', user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username);
            }
        } catch (error) {
            if (error instanceof Error) {
                // Silent fail or low prio alert
                console.log('Error loading user data:', error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            const updates = {
                id: user.id,
                username,
                updated_at: new Date().toISOString(),
            };

            const { withTimeout } = require('../../utils');

            // Wrap the specific supabase call
            const updatePromise = supabase.from('profiles').upsert(updates);

            const { error } = await withTimeout(
                updatePromise,
                10000,
                'Profile update timed out. Please check your connection.'
            );

            if (error) {
                throw error;
            }

            // Refresh profile in AuthContext
            await withTimeout(refreshProfile(), 5000, 'Profile refreshed failed, but data saved.');

            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        } catch (error: any) {
            console.error('Update failed:', error);
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Error', 'An unexpected error occurred during profile update.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
                >
                    <ArrowLeft size={24} color="#9CA3AF" />
                </Pressable>
                <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">Edit Profile</Text>
                <View className="w-10" />
            </View>

            <FadeInView className="flex-1 px-6 pt-8">

                <View className="space-y-4">
                    <View>
                        <Text className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">Username</Text>
                        <View className="flex-row items-center px-4 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <User size={20} color="#9CA3AF" />
                            <TextInput
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                className="flex-1 ml-3 text-base text-text-primary dark:text-text-dark font-body"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">Email</Text>
                        <View className="flex-row items-center px-4 h-12 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 opacity-70">
                            <Mail size={20} color="#9CA3AF" />
                            <TextInput
                                value={user?.email}
                                editable={false}
                                className="flex-1 ml-3 text-base text-text-secondary font-body"
                            />
                        </View>
                        <Text className="text-xs text-gray-500 mt-1 ml-1">Email cannot be changed</Text>
                    </View>
                </View>
            </FadeInView>

            <View className="p-6">
                <Pressable
                    onPress={updateProfile}
                    disabled={loading}
                    className={`h-14 rounded-2xl flex-row items-center justify-center gap-2 ${loading ? 'bg-primary/70' : 'bg-primary'} active:opacity-90 shadow-lg shadow-primary/30`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save size={20} color="white" />
                            <Text className="text-white font-bold text-lg font-display">Save Changes</Text>
                        </>
                    )}
                </Pressable>
            </View>

        </SafeAreaView>
    );
}
