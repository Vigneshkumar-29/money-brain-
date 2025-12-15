import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Bell,
  Wallet,
  TrendingUp,
  MoreHorizontal,
  Zap,
  Tag,
  Car,
  ShoppingBag,
  Utensils,
  AlertTriangle,
  Trophy,
  FileText,
  TableProperties,
  ArrowRight
} from 'lucide-react-native';

const GlassPanel = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: any }) => (
  <View className={`overflow-hidden rounded-2xl border border-white/10 ${className}`} style={style}>
    <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" className="absolute inset-0" />
    <LinearGradient
      colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="absolute inset-0"
    />
    {children}
  </View>
);

const GlassPanelHighlight = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: any }) => (
  <View className={`overflow-hidden rounded-2xl border border-primary/20 ${className}`} style={style}>
    <BlurView intensity={Platform.OS === 'ios' ? 30 : 100} tint="dark" className="absolute inset-0" />
    <LinearGradient
      colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="absolute inset-0"
    />
    {children}
  </View>
);

export default function AnalyticsScreen() {
  const { transactions, totals } = useTransactions();
  const [selectedMonth, setSelectedMonth] = useState('January');

  const months = ['January', 'February', 'March', 'April', 'May'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentages for "Spending Mix"
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const totalExp = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount,
        percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
        color: getColorForCategory(category)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [transactions]);

  function getColorForCategory(cat: string) {
    if (cat.toLowerCase().includes('food')) return '#A78BFA'; // Purple-400
    if (cat.toLowerCase().includes('shopping')) return '#36e27b'; // Primary
    if (cat.toLowerCase().includes('transport')) return '#60A5FA'; // Blue-400
    return '#9CA3AF'; // Gray-500
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <View className="pt-12 pb-2 px-6 bg-background-dark/80 flex-row items-center justify-between z-20">
        <View className="flex-row items-center gap-3">
          <View className="relative">
            <View className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full opacity-30 blur-sm" />
            <Image
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDj0wuqHI0ukw-riUMhtLexclGOzLXf1NyQ9j-jRuLnMfww2tGGHo5r50qONfnQtsPnppnF5udGUrbEEMhiXhgzfNm1Rt9teVFMX5M0GreLyzQGvYTibJ4El7IRZGIbc21LTicITXZuKXYh0MRF4fIOyb4zIMpZ5OYrGS3ZyDH8a177CZT2Hv3GQ5agQ5odrEb5pasBmrrGbNxeXvB0EHN0_1ZzB50m0i0bg-Cw7BGmBXyMKsMlxWHH72l3--8KWksBCEvLSlAE3uY" }}
              className="w-10 h-10 rounded-full border border-white/10"
            />
          </View>
          <View>
            <Text className="text-xs text-gray-400 font-medium tracking-wide font-display">Welcome back</Text>
            <Text className="text-white text-xl font-bold leading-none tracking-tight font-display">MoneyMind</Text>
          </View>
        </View>
        <GlassPanel className="w-10 h-10 rounded-full items-center justify-center">
          <Pressable className="w-full h-full items-center justify-center">
            <Bell size={24} color="white" />
            <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(54,226,123,0.4)]" />
          </Pressable>
        </GlassPanel>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Month Selector */}
        <View className="px-6 py-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            <View className="flex-row gap-3">
              {months.map((month) => (
                <Pressable
                  key={month}
                  onPress={() => setSelectedMonth(month)}
                  className={`h-9 px-5 rounded-full items-center justify-center ${selectedMonth === month
                    ? 'bg-primary shadow-[0_0_15px_rgba(54,226,123,0.3)]'
                    : 'bg-white/5 border border-white/5'
                    }`}
                >
                  <Text className={`text-sm font-display ${selectedMonth === month ? 'font-bold text-black' : 'font-medium text-gray-400'
                    }`}>
                    {month}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats Overview */}
        <View className="flex-row gap-4 px-6 mb-6">
          <GlassPanelHighlight className="flex-1 p-5 justify-between min-h-[140px]">
            <View className="absolute -right-4 -top-4 bg-primary/10 w-20 h-20 rounded-full blur-xl" />
            <View className="flex-row justify-between items-start z-10">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider font-display">Total Balance</Text>
              <Wallet size={20} color="#36e27b" />
            </View>
            <View className="z-10">
              <Text className="text-white text-2xl font-bold tracking-tight mb-1 font-display">{formatCurrency(totals.balance)}</Text>
              <View className="flex-row items-center gap-1 bg-white/5 self-start px-2 py-0.5 rounded-md">
                <TrendingUp size={12} color="#36e27b" />
                <Text className="text-primary text-xs font-bold font-display">+3.2%</Text>
              </View>
            </View>
          </GlassPanelHighlight>

          <GlassPanel className="flex-1 p-5 justify-between min-h-[140px]">
            <View className="flex-row justify-between items-start z-10">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider font-display">Net Change</Text>
              <TrendingUp size={20} color="rgba(255,255,255,0.5)" />
            </View>
            <View className="z-10">
              <Text className="text-white text-2xl font-bold tracking-tight mb-1 font-display">
                {totals.income - totals.expense >= 0 ? '+' : ''}{formatCurrency(totals.income - totals.expense)}
              </Text>
              <Text className="text-gray-500 text-xs font-normal font-display">vs last month</Text>
            </View>
          </GlassPanel>
        </View>

        {/* Income vs Expenses Chart */}
        <View className="px-6 mb-6">
          <GlassPanel className="p-6">
            <View className="flex-row justify-between items-end mb-6">
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 font-display">Income vs Expenses</Text>
                <Text className="text-white text-2xl font-bold font-display">
                  {formatCurrency(totals.income)} <Text className="text-primary font-normal text-lg">In</Text>
                </Text>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(54,226,123,0.4)]" />
                  <Text className="text-xs text-gray-400 font-display">In</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-white/20" />
                  <Text className="text-xs text-gray-400 font-display">Out</Text>
                </View>
              </View>
            </View>

            {/* Mock Bar Chart Viz - In a real app use dynamic data */}
            <View className="flex-row justify-between h-[160px] items-end px-2">
              {[1, 2, 3, 4].map((week) => (
                <View key={week} className="flex-col items-center gap-2 h-full justify-end flex-1 mx-1">
                  <View className="relative w-full flex-row justify-center gap-1 h-full items-end">
                    <View className="w-2.5 bg-white/20 rounded-t-sm" style={{ height: `${30 + Math.random() * 30}%` }} />
                    <View className="w-2.5 bg-primary rounded-t-sm shadow-[0_0_12px_rgba(54,226,123,0.4)]" style={{ height: `${40 + Math.random() * 50}%` }} />
                  </View>
                  <Text className="text-gray-500 text-[10px] font-bold uppercase font-display">Wk {week}</Text>
                </View>
              ))}
            </View>
          </GlassPanel>
        </View>

        {/* Spending Mix Chart */}
        <View className="px-6 mb-6">
          <GlassPanel className="p-6">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 font-display">Spending Mix</Text>
                <Text className="text-white text-2xl font-bold font-display">
                  {formatCurrency(totals.expense)} <Text className="text-gray-400 font-normal text-lg">Out</Text>
                </Text>
              </View>
              <Pressable className="w-8 h-8 items-center justify-center rounded-full bg-white/5">
                <MoreHorizontal size={18} color="white" />
              </Pressable>
            </View>

            <View className="gap-5">
              {categoryData.length > 0 ? categoryData.map((item, index) => (
                <View key={index} className="gap-2">
                  <View className="flex-row justify-between">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, shadowColor: item.color, shadowOpacity: 0.6, shadowRadius: 8, elevation: 5 }} />
                      <Text className="text-white font-medium text-sm font-display">{item.label}</Text>
                    </View>
                    <Text className="text-white font-bold text-sm font-mono">{formatCurrency(item.value)}</Text>
                  </View>
                  <View className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                        shadowColor: item.color,
                        shadowOpacity: 0.4,
                      }}
                    />
                  </View>
                </View>
              )) : (
                <Text className="text-gray-500 text-sm py-4 text-center font-display">No expenses yet</Text>
              )}
            </View>
          </GlassPanel>
        </View>

        {/* AI Insights */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <Zap size={20} color="#36e27b" />
            <Text className="text-white text-lg font-bold font-display">AI Insights</Text>
          </View>
          <View className="gap-3">
            <GlassPanel className="p-4 flex-row items-start gap-3 border-l-4 border-l-orange-500 relative overflow-hidden">
              <LinearGradient colors={['rgba(249,115,22,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} className="absolute inset-0" />
              <AlertTriangle size={20} color="#F97316" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-orange-100 text-sm leading-relaxed font-body">
                  <Text className="text-white font-bold">Alert: </Text>
                  You spent <Text className="text-white font-bold">25% more</Text> on food this month compared to your average.
                </Text>
              </View>
            </GlassPanel>

            <GlassPanel className="p-4 flex-row items-start gap-3 border-l-4 border-l-primary relative overflow-hidden">
              <LinearGradient colors={['rgba(54,226,123,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} className="absolute inset-0" />
              <Trophy size={20} color="#36e27b" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-green-100 text-sm leading-relaxed font-body">
                  <Text className="text-white font-bold">Top Category: </Text>
                  {categoryData[0]?.label || 'Shopping'} is your highest expense category at <Text className="text-white font-bold">{formatCurrency(categoryData[0]?.value || 0)}</Text>.
                </Text>
              </View>
            </GlassPanel>
          </View>
        </View>

        {/* Export Actions */}
        <View className="px-6 mb-8 flex-row gap-4">
          <Pressable className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 flex-row items-center justify-center gap-2 active:scale-95 transition-transform">
            <FileText size={20} color="white" />
            <Text className="text-white text-sm font-bold font-display">Export PDF</Text>
          </Pressable>
          <Pressable className="flex-1 h-12 rounded-xl border border-white/10 bg-white/5 flex-row items-center justify-center gap-2 active:scale-95 transition-transform">
            <TableProperties size={20} color="white" />
            <Text className="text-white text-sm font-bold font-display">Export CSV</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
