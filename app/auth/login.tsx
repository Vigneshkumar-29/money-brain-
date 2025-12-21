import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function LoginScreen() {
    // const router = useRouter(); // Unused
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const handleLogin = async () => {
        if (loading) return;
        setErrorMsg(null);

        if (!email || !password) {
            setErrorMsg('Please enter both email and password.');
            return;
        }

        setLoading(true);

        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out. Please check your connection.')), 15000)
        );

        try {
            await Promise.race([signIn(email, password), timeout]);
            // If we're here, sign in was successful. 
            // The AuthContext will handle navigation based on auth state changes.
            // We keep loading true to prevent user interaction while redirecting.
        } catch (error: any) {
            if (mounted.current) {
                // If it's a specific auth error, display it nicely
                if (error.message.includes('Invalid login credentials')) {
                    setErrorMsg('Invalid email or password. Please try again.');
                } else {
                    setErrorMsg(error.message || 'An unexpected error occurred.');
                }
                setLoading(false);
            }
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
                    {/* Error Message Display */}
                    {errorMsg && (
                        <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex-row items-center mb-2">
                            <AlertCircle size={20} color="#EF4444" style={{ marginRight: 8 }} />
                            <Text className="text-red-400 font-body flex-1 text-sm">{errorMsg}</Text>
                        </View>
                    )}

                    <View className="space-y-2">
                        <Text className="text-text-secondary text-base font-body ml-1">Email Address</Text>
                        <View className={`flex-row items-center bg-card-dark border rounded-2xl px-4 h-14 ${errorMsg ? 'border-red-500/30' : 'border-white/5'}`}>
                            <Mail size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text-dark font-body text-base"
                                placeholder="john@example.com"
                                placeholderTextColor="#4B5563"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errorMsg) setErrorMsg(null);
                                }}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    <View className="space-y-2">
                        <Text className="text-text-secondary text-base font-body ml-1">Password</Text>
                        <View className={`flex-row items-center bg-card-dark border rounded-2xl px-4 h-14 ${errorMsg ? 'border-red-500/30' : 'border-white/5'}`}>
                            <Lock size={20} color="#6B7280" />
                            <TextInput
                                className="flex-1 ml-3 text-text-dark font-body text-base"
                                placeholder="••••••••"
                                placeholderTextColor="#4B5563"
                                secureTextEntry
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errorMsg) setErrorMsg(null);
                                }}
                                editable={!loading}
                            />
                        </View>
                    </View>

                    <TouchableOpacity className="items-end" disabled={loading}>
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
                    <Text className="text-text-secondary font-body">Don&apos;t have an account? </Text>
                    <Link href="/auth/sign-up" asChild>
                        <TouchableOpacity disabled={loading}>
                            <Text className="text-primary font-display">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </SafeAreaView>
        </View>
    );
}
