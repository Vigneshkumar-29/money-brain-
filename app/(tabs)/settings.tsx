import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { useColorScheme } from 'nativewind';
import { Moon, Sun, ChevronRight, User, Bell, Shield, LogOut } from 'lucide-react-native';
import FadeInView from '../../components/ui/FadeInView';
import { useAuth } from '../../context/AuthContext';

import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { signOut } = useAuth();
  const isDark = colorScheme === 'dark';

  const SettingItem = ({ icon: Icon, title, value, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800/50 rounded-lg px-1"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3.5">
          <Icon size={20} color={isDark ? '#E5E7EB' : '#374151'} strokeWidth={2.5} />
        </View>
        <Text className="text-base font-body font-semibold text-text-primary dark:text-text-dark">{title}</Text>
      </View>
      <View className="flex-row items-center">
        {value}
        {onPress && <ChevronRight size={20} color="#9CA3AF" strokeWidth={2.5} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-5 pt-6">
        <FadeInView delay={0}>
          <Text className="text-3xl font-display font-bold text-text-primary dark:text-text-dark mb-8">Settings</Text>
        </FadeInView>

        <FadeInView delay={50} className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-800 mb-6">
          <Text className="text-xs font-display font-bold text-text-secondary mb-3 uppercase tracking-wider">Appearance</Text>
          <SettingItem
            icon={isDark ? Moon : Sun}
            title="Dark Mode"
            value={
              <Switch
                value={isDark}
                onValueChange={toggleColorScheme}
                trackColor={{ false: '#E5E7EB', true: '#2ECC71' }}
                thumbColor={'#FFFFFF'}
              />
            }
          />
        </FadeInView>

        <FadeInView delay={100} className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-md border border-gray-100 dark:border-gray-800">
          <Text className="text-xs font-display font-bold text-text-secondary mb-3 uppercase tracking-wider">General</Text>
          <SettingItem icon={User} title="Profile" onPress={() => router.push('/settings/profile')} />
          <SettingItem icon={Bell} title="Notifications" onPress={() => router.push('/settings/notifications')} />
          <SettingItem icon={Shield} title="Security" onPress={() => router.push('/settings/security')} />
        </FadeInView>

        <FadeInView delay={150} className="mt-6 mb-10">
          <TouchableOpacity
            onPress={signOut}
            className="flex-row items-center justify-center p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 active:opacity-80"
          >
            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            <Text className="ml-2 text-base font-display font-bold text-red-500">Log Out</Text>
          </TouchableOpacity>
        </FadeInView>
      </View>
    </SafeAreaView>
  );
}
// End of Settings component
