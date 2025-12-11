import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { ArrowRight, Mail, Lock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await signIn(email, password);
            // Router redirect is handled in AuthContext
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-background-dark">
            <StatusBar style="light" />

            <SafeAreaView className="flex-1 justify-center px-6">
                <View className="items-center mb-12">
                    <View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center mb-4 border border-primary/30">
                        <View className="w-8 h-8 bg-primary rounded-lg" />
                    </View>
                    <Text className="text-3xl text-text-dark font-display text-center mb-2">Welcome Back</Text>
                    <Text className="text-text-secondary font-body text-center">Sign in to continue to MoneyMind</Text>
                </View>

                <View className="space-y-4">
                    <View className="space-y-2">
                        <Text className="text-text-secondary text-base font-body ml-1">Email Address</Text>
                        <View className="flex-row items-center bg-card-dark border border-white/5 rounded-2xl px-4 h-14">
                            <Mail size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text-dark font-body text-base"
                                placeholder="john@example.com"
                                placeholderTextColor="#4B5563"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View className="space-y-2">
                        <Text className="text-text-secondary text-base font-body ml-1">Password</Text>
                        <View className="flex-row items-center bg-card-dark border border-white/5 rounded-2xl px-4 h-14">
                            <Lock size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text-dark font-body text-base"
                                placeholder="••••••••"
                                placeholderTextColor="#4B5563"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity className="items-end">
                        <Text className="text-primary font-body text-sm">Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={loading}
                        className={`bg-primary h-14 rounded-2xl flex-row items-center justify-center mt-4 ${loading ? 'opacity-70' : 'active:opacity-90'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#0F1419" />
                        ) : (
                            <>
                                <Text className="text-background-dark font-display text-lg mr-2">Sign In</Text>
                                <ArrowRight size={20} color="#0F1419" strokeWidth={2.5} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="flex-row justify-center mt-8">
                    <Text className="text-text-secondary font-body">Don't have an account? </Text>
                    <Link href="/auth/sign-up" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary font-display">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </SafeAreaView>
        </View>
    );
}
