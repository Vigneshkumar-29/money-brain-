import { View, Text, ScrollView, Pressable, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell,
  TrendingUp,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Film,
  ShoppingCart,
  DollarSign,
  Car,
  Plus
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTransactions } from '../../context/TransactionContext';

const { width } = Dimensions.get('window');

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
  const { totals } = useTransactions();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatMainBalance = (amount: number) => {
    const parts = formatCurrency(amount).split('.');
    return {
      main: parts[0],
      decimal: parts[1] || '00'
    };
  };

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
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

          {/* Header */}
          <View className="flex-row items-center justify-between py-6">
            <View className="flex-row items-center gap-4">
              <View className="relative">
                <LinearGradient
                  colors={['rgba(54, 226, 123, 0.5)', 'transparent']}
                  className="p-[2px] rounded-full"
                >
                  <Image
                    source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDj0wuqHI0ukw-riUMhtLexclGOzLXf1NyQ9j-jRuLnMfww2tGGHo5r50qONfnQtsPnppnF5udGUrbEEMhiXhgzfNm1Rt9teVFMX5M0GreLyzQGvYTibJ4El7IRZGIbc21LTicITXZuKXYh0MRF4fIOyb4zIMpZ5OYrGS3ZyDH8a177CZT2Hv3GQ5agQ5odrEb5pasBmrrGbNxeXvB0EHN0_1ZzB50m0i0bg-Cw7BGmBXyMKsMlxWHH72l3--8KWksBCEvLSlAE3uY" }}
                    className="w-12 h-12 rounded-full bg-cover"
                  />
                </LinearGradient>
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-background-dark rounded-full" />
              </View>
              <View>
                <Text className="text-sm font-medium text-gray-400 font-display">Good Evening,</Text>
                <Text className="text-xl font-bold text-white tracking-tight font-display">Alex Morgan</Text>
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
              <View className="flex-row items-center gap-2 mt-4">
                <View className="flex-row items-center justify-center px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <TrendingUp size={14} color="#36e27b" style={{ marginRight: 4 }} />
                  <Text className="text-primary text-xs font-bold font-display">+2.4%</Text>
                </View>
                <Text className="text-xs text-gray-500 font-display">vs last month</Text>
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
                <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-mono text-emerald-400">+12%</Text>
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
                <View className="bg-rose-500/10 px-2 py-0.5 rounded-full">
                  <Text className="text-xs font-mono text-rose-400">-5%</Text>
                </View>
              </View>
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 font-display">Expenses</Text>
                <Text className="text-xl font-bold text-white font-display">{formatCurrency(totals.expense)}</Text>
              </View>
            </GlassPanel>
          </View>

          {/* Budget Circular Progress */}
          <GlassPanel className="p-5 mb-6 flex-row items-center justify-between">
            <View className="flex-1 gap-1">
              <Text className="text-white font-bold text-lg font-display">Monthly Budget</Text>
              <Text className="text-gray-400 text-sm font-display">You have spent <Text className="text-white font-medium">$1,850</Text> of $2,800</Text>
              <Pressable className="mt-3 flex-row items-center gap-1">
                <Text className="text-primary text-sm font-semibold font-display">Adjust Limit</Text>
                <ChevronRight size={16} color="#36e27b" />
              </Pressable>
            </View>
            <View className="w-20 h-20 items-center justify-center relative">
              {/* Simplified Circle for React Native - In a real app use react-native-svg or custom drawing */}
              <View className="w-full h-full rounded-full border-[3px] border-gray-800 absolute" />
              <View className="w-full h-full rounded-full border-[3px] border-primary border-r-transparent border-b-transparent absolute transform -rotate-45" />
              <View className="absolute items-center">
                <Text className="text-xs font-bold text-white font-display">65%</Text>
              </View>
            </View>
          </GlassPanel>

          {/* Recent Activity */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4 px-2">
              <Text className="text-lg font-bold text-white font-display">Recent Activity</Text>
              <Pressable>
                <Text className="text-sm text-primary font-medium font-display">See All</Text>
              </Pressable>
            </View>

            <View className="gap-3">
              <GlassPanel className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/10">
                    <Film size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-sm font-display">Netflix</Text>
                    <Text className="text-gray-400 text-xs font-display">Subscription • Today</Text>
                  </View>
                </View>
                <Text className="text-white font-bold font-display">-$15.99</Text>
              </GlassPanel>

              <GlassPanel className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/10">
                    <ShoppingCart size={20} color="#f97316" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-sm font-display">Whole Foods</Text>
                    <Text className="text-gray-400 text-xs font-display">Groceries • Yesterday</Text>
                  </View>
                </View>
                <Text className="text-white font-bold font-display">-$84.20</Text>
              </GlassPanel>

              <GlassPanel className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/10">
                    <DollarSign size={20} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-sm font-display">Salary Deposit</Text>
                    <Text className="text-gray-400 text-xs font-display">Income • Nov 28</Text>
                  </View>
                </View>
                <Text className="text-emerald-400 font-bold font-display">+$2,100.00</Text>
              </GlassPanel>

              <GlassPanel className="p-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/10">
                    <Car size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-sm font-display">Uber</Text>
                    <Text className="text-gray-400 text-xs font-display">Transport • Nov 27</Text>
                  </View>
                </View>
                <Text className="text-white font-bold font-display">-$24.50</Text>
              </GlassPanel>

            </View>
          </View>

        </ScrollView>

        {/* Floating Action Button */}
        <View className="absolute bottom-28 right-6">
          <Pressable
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            style={{
              shadowColor: '#36e27b',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={() => router.push('/transaction-modal')}
          >
            <Plus size={28} color="black" strokeWidth={3} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
