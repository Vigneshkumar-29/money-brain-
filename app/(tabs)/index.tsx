import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  ArrowDown,
  ArrowUp,
  Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { rs, getIconSize, getContainerPadding } from '../../lib/responsive';
import { getIconComponent, getCategoryColor } from '../../lib/preferences';
import { getRelativeTime } from '../../utils/formatting';

// const { width } = Dimensions.get('window'); // Unused
const containerPadding = getContainerPadding();

const GlassPanel = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: any }) => (
  <View className={`overflow-hidden rounded-3xl border border-white/10 ${className}`} style={style}>
    <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" className="absolute inset-0" />
    <LinearGradient
      colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="absolute inset-0"
    />
    {children}
  </View>
);

export default function Dashboard() {
  const router = useRouter();
  const { totals, transactions } = useTransactions();
  const { profile, user } = useAuth();
  const { formatCurrency, currencySymbol, getCategoryById } = usePreferences();

  const formatMainBalance = (amount: number) => {
    const formatted = formatCurrency(amount);
    // Try to split at decimal point
    const parts = formatted.split('.');
    if (parts.length === 2) {
      return {
        main: parts[0],
        decimal: parts[1].replace(/[^0-9]/g, '').substring(0, 2) || '00'
      };
    }
    return {
      main: formatted,
      decimal: '00'
    };
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get username or fallback
  const username = profile?.username || user?.email?.split('@')[0] || 'User';

  // Get avatar URL or generate one
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=36e27b&color=fff&size=128`;

  const balanceParts = formatMainBalance(totals.balance);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Abstract Background Glows */}
      <View className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-primary/20 blur-[100px]" style={{ transform: [{ scale: 1.5 }] }} />
      <View className="absolute bottom-[10%] right-[-5%] w-[250px] h-[250px] rounded-full bg-blue-500/10 blur-[80px]" style={{ transform: [{ scale: 1.5 }] }} />

      {/* Adding a BlurView over the background blobs to simulate the blur filter if native blur radius isn't enough,
            but simple views with opacity typically work well enough for 'glows' in RN.
            For better results, we might rely on the native rendering. */}

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          style={{ paddingHorizontal: containerPadding }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: rs(150) }}
        >

          {/* Header */}
          <View className="flex-row items-center justify-between py-6">
            <View className="flex-row items-center gap-4">
              <View className="relative">
                <LinearGradient
                  colors={['rgba(54, 226, 123, 0.5)', 'transparent']}
                  className="p-[2px] rounded-full"
                >
                  <Image
                    source={{ uri: avatarUrl }}
                    className="w-12 h-12 rounded-full bg-cover"
                  />
                </LinearGradient>
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-background-dark rounded-full" />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-400 font-display">{getGreeting()},</Text>
                <Text className="text-xl font-bold text-white tracking-tight font-display">{username}</Text>
              </View>
            </View>
            <GlassPanel className="w-10 h-10 rounded-full flex items-center justify-center">
              <Pressable className="w-full h-full items-center justify-center">
                <Bell size={20} color="white" />
                <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full" />
              </Pressable>
            </GlassPanel>
          </View>

          {/* Balance Card */}
          <GlassPanel className="p-6 mb-4 relative overflow-hidden">
            <View className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <View className="relative z-10">
              <Text className="text-gray-400 text-sm font-medium mb-1 font-display">Total Balance</Text>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-4xl font-bold text-white tracking-tight font-display">{balanceParts.main}</Text>
                <Text className="text-2xl text-gray-400 font-normal font-display">.{balanceParts.decimal}</Text>
              </View>
            </View>
          </GlassPanel>

          {/* Stats Grid */}
          <View className="flex-row gap-4 mb-6">
            {/* Income */}
            <GlassPanel className="flex-1 p-5 justify-between min-h-[140px]">
              <View className="flex-row items-start justify-between">
                <View className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ArrowDown size={20} color="#34d399" />
                </View>
              </View>
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 font-display">Income</Text>
                <Text className="text-xl font-bold text-white font-display">{formatCurrency(totals.income)}</Text>
              </View>
            </GlassPanel>

            {/* Expenses */}
            <GlassPanel className="flex-1 p-5 justify-between min-h-[140px]">
              <View className="flex-row items-start justify-between">
                <View className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ArrowUp size={20} color="#fb7185" />
                </View>
              </View>
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 font-display">Expenses</Text>
                <Text className="text-xl font-bold text-white font-display">{formatCurrency(totals.expense)}</Text>
              </View>
            </GlassPanel>
          </View>



          {/* Recent Activity */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4 px-2">
              <Text className="text-lg font-bold text-white font-display">Recent Activity</Text>
              <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                <Text className="text-sm text-primary font-medium font-display">See All</Text>
              </Pressable>
            </View>

            <View className="gap-3">
              {transactions.slice(0, 4).map((transaction) => {
                // Get category info from preferences
                const categoryInfo = getCategoryById(transaction.category);
                const Icon = getIconComponent(categoryInfo?.icon || 'DollarSign');
                const categoryColor = categoryInfo?.color || '#6b7280';
                const isIncome = transaction.type === 'income' || transaction.type === 'borrowed';

                // Use income color override
                const displayColor = isIncome ? '#10b981' : categoryColor;

                return (
                  <GlassPanel key={transaction.id} className="p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-4">
                      <View
                        className="w-12 h-12 rounded-full flex items-center justify-center border"
                        style={{
                          backgroundColor: `${displayColor}20`,
                          borderColor: `${displayColor}10`
                        }}
                      >
                        <Icon size={20} color={displayColor} />
                      </View>
                      <View>
                        <Text className="text-white font-bold text-sm font-display">{transaction.title}</Text>
                        <Text className="text-gray-400 text-xs font-display">
                          {categoryInfo?.label || transaction.category} • {getRelativeTime(transaction.date)}
                        </Text>
                      </View>
                    </View>
                    <Text className={`${isIncome ? 'text-emerald-400' : 'text-white'} font-bold font-display`}>
                      {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </Text>
                  </GlassPanel>
                );
              })}

              {transactions.length === 0 && (
                <View className="py-8 items-center justify-center">
                  <Text className="text-gray-500 text-sm font-display">No transactions yet</Text>
                  <Text className="text-gray-600 text-xs font-display mt-1">Add your first transaction to get started</Text>
                </View>
              )}
            </View>
          </View>

        </ScrollView>

        {/* Floating Action Button */}
        <View style={{ position: 'absolute', bottom: rs(112), right: rs(24) }}>
          <Pressable
            className="rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            style={{
              width: rs(56),
              height: rs(56),
              shadowColor: '#36e27b',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={() => router.push('/transaction-modal')}
          >
            <Plus size={getIconSize(28)} color="black" strokeWidth={3} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
