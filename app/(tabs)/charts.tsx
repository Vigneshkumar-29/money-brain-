import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
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
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
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
  const { profile, user } = useAuth();

  // Get current month as default
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Generate available months from transaction data
  const availableMonths = useMemo(() => {
    if (transactions.length === 0) {
      // If no transactions, show current month
      return [{
        monthIndex: currentMonthIndex,
        year: currentYear,
        label: new Date(currentYear, currentMonthIndex).toLocaleString('en-US', { month: 'long' }),
        shortLabel: new Date(currentYear, currentMonthIndex).toLocaleString('en-US', { month: 'short' }),
        transactionCount: 0
      }];
    }

    const monthsMap = new Map<string, { monthIndex: number, year: number, count: number }>();

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;

      if (monthsMap.has(key)) {
        monthsMap.get(key)!.count++;
      } else {
        monthsMap.set(key, { monthIndex: month, year, count: 1 });
      }
    });

    // Convert to array and sort by date (newest first)
    return Array.from(monthsMap.entries())
      .map(([key, data]) => ({
        monthIndex: data.monthIndex,
        year: data.year,
        label: new Date(data.year, data.monthIndex).toLocaleString('en-US', { month: 'long' }),
        shortLabel: new Date(data.year, data.monthIndex).toLocaleString('en-US', { month: 'short' }),
        transactionCount: data.count
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthIndex - a.monthIndex;
      })
      .slice(0, 12); // Show last 12 months max
  }, [transactions, currentMonthIndex, currentYear]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const date = new Date(tx.date);
      return date.getMonth() === selectedMonthIndex && date.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonthIndex, selectedYear]);

  // Calculate totals for selected month
  const monthlyTotals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income' || curr.type === 'borrowed') {
          acc.income += curr.amount;
          acc.balance += curr.amount;
        } else {
          acc.expense += curr.amount;
          acc.balance -= curr.amount;
        }
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [filteredTransactions]);

  // Get username or fallback
  const username = profile?.username || user?.email?.split('@')[0] || 'User';

  // Get avatar URL or generate one
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=36e27b&color=fff&size=128`;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentages for "Spending Mix" - using filtered transactions
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(tx => tx.type === 'expense');
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
  }, [filteredTransactions]);

  // Calculate weekly data for the selected month
  const weeklyData = useMemo(() => {
    const weeks = [
      { income: 0, expense: 0 },
      { income: 0, expense: 0 },
      { income: 0, expense: 0 },
      { income: 0, expense: 0 }
    ];

    filteredTransactions.forEach(tx => {
      const date = new Date(tx.date);
      const dayOfMonth = date.getDate();
      const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);

      if (tx.type === 'income' || tx.type === 'borrowed') {
        weeks[weekIndex].income += tx.amount;
      } else {
        weeks[weekIndex].expense += tx.amount;
      }
    });

    return weeks;
  }, [filteredTransactions]);

  // Get selected month display name
  const selectedMonthName = availableMonths.find(
    m => m.monthIndex === selectedMonthIndex && m.year === selectedYear
  )?.label || new Date(selectedYear, selectedMonthIndex).toLocaleString('en-US', { month: 'long' });

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
              source={{ uri: avatarUrl }}
              className="w-10 h-10 rounded-full border border-white/10"
            />
          </View>
          <View>
            <Text className="text-xs text-gray-400 font-medium tracking-wide font-display">Welcome back</Text>
            <Text className="text-white text-xl font-bold leading-none tracking-tight font-display">{username}</Text>
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
        {/* Professional Month/Year Picker */}
        <View className="px-6 py-4">
          <GlassPanel className="p-4">
            <View className="flex-row items-center justify-between">
              {/* Previous Month Button */}
              <Pressable
                onPress={() => {
                  const newDate = new Date(selectedYear, selectedMonthIndex - 1);
                  setSelectedMonthIndex(newDate.getMonth());
                  setSelectedYear(newDate.getFullYear());
                }}
                className="w-10 h-10 rounded-full bg-white/5 items-center justify-center active:bg-white/10"
              >
                <ArrowLeft size={20} color="#36e27b" />
              </Pressable>

              {/* Current Month/Year Display */}
              <Pressable
                className="flex-1 mx-4"
                onPress={() => {
                  // Reset to current month
                  setSelectedMonthIndex(currentMonthIndex);
                  setSelectedYear(currentYear);
                }}
              >
                <View className="items-center">
                  <Text className="text-white text-xl font-bold font-display">
                    {selectedMonthName}
                  </Text>
                  <Text className="text-gray-400 text-sm font-display mt-0.5">
                    {selectedYear}
                  </Text>
                  {filteredTransactions.length > 0 && (
                    <View className="flex-row items-center gap-1 mt-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <Text className="text-primary text-xs font-bold font-display">
                        {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>

              {/* Next Month Button */}
              <Pressable
                onPress={() => {
                  const newDate = new Date(selectedYear, selectedMonthIndex + 1);
                  setSelectedMonthIndex(newDate.getMonth());
                  setSelectedYear(newDate.getFullYear());
                }}
                disabled={selectedMonthIndex === currentMonthIndex && selectedYear === currentYear}
                className={`w-10 h-10 rounded-full items-center justify-center ${selectedMonthIndex === currentMonthIndex && selectedYear === currentYear
                  ? 'bg-white/5 opacity-30'
                  : 'bg-white/5 active:bg-white/10'
                  }`}
              >
                <ArrowRight size={20} color="#36e27b" />
              </Pressable>
            </View>

            {/* Quick Month Navigation */}
            <View className="mt-4 pt-4 border-t border-white/5">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {availableMonths.map((month) => {
                    const isSelected = month.monthIndex === selectedMonthIndex && month.year === selectedYear;

                    return (
                      <Pressable
                        key={`${month.year}-${month.monthIndex}`}
                        onPress={() => {
                          setSelectedMonthIndex(month.monthIndex);
                          setSelectedYear(month.year);
                        }}
                        className={`px-3 py-1.5 rounded-full ${isSelected
                          ? 'bg-primary'
                          : 'bg-white/5 border border-white/10'
                          }`}
                      >
                        <Text className={`text-xs font-display ${isSelected ? 'font-bold text-black' : 'font-medium text-gray-400'
                          }`}>
                          {month.shortLabel} {month.year !== currentYear ? `'${String(month.year).slice(-2)}` : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </GlassPanel>
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
              <Text className="text-white text-2xl font-bold tracking-tight mb-1 font-display">{formatCurrency(monthlyTotals.balance)}</Text>
              <Text className="text-gray-500 text-xs font-normal font-display">for {selectedMonthName}</Text>
            </View>
          </GlassPanelHighlight>

          <GlassPanel className="flex-1 p-5 justify-between min-h-[140px]">
            <View className="flex-row justify-between items-start z-10">
              <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider font-display">Net Change</Text>
              <TrendingUp size={20} color="rgba(255,255,255,0.5)" />
            </View>
            <View className="z-10">
              <Text className="text-white text-2xl font-bold tracking-tight mb-1 font-display">
                {monthlyTotals.income - monthlyTotals.expense >= 0 ? '+' : ''}{formatCurrency(monthlyTotals.income - monthlyTotals.expense)}
              </Text>
              <Text className="text-gray-500 text-xs font-normal font-display">net change</Text>
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
                  {formatCurrency(monthlyTotals.income)} <Text className="text-primary font-normal text-lg">In</Text>
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

            {/* Weekly Bar Chart with Real Data */}
            <View className="flex-row justify-between h-[160px] items-end px-2">
              {weeklyData.map((week, index) => {
                const maxAmount = Math.max(
                  ...weeklyData.map(w => Math.max(w.income, w.expense)),
                  1
                );
                const expenseHeight = (week.expense / maxAmount) * 100;
                const incomeHeight = (week.income / maxAmount) * 100;
                const hasData = week.income > 0 || week.expense > 0;

                return (
                  <View key={index} className="flex-col items-center gap-2 h-full justify-end flex-1 mx-1">
                    <View className="relative w-full flex-row justify-center gap-1 h-full items-end">
                      <View
                        className="w-2.5 bg-white/20 rounded-t-sm"
                        style={{ height: hasData ? `${Math.max(expenseHeight, 5)}%` : '5%' }}
                      />
                      <View
                        className="w-2.5 bg-primary rounded-t-sm shadow-[0_0_12px_rgba(54,226,123,0.4)]"
                        style={{ height: hasData ? `${Math.max(incomeHeight, 5)}%` : '5%' }}
                      />
                    </View>
                    <Text className="text-gray-500 text-[10px] font-bold uppercase font-display">Wk {index + 1}</Text>
                  </View>
                );
              })}
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
                  {formatCurrency(monthlyTotals.expense)} <Text className="text-gray-400 font-normal text-lg">Out</Text>
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
            {categoryData.length > 0 && (
              <>
                {/* Top Category Insight */}
                <GlassPanel className="p-4 flex-row items-start gap-3 border-l-4 border-l-primary relative overflow-hidden">
                  <LinearGradient colors={['rgba(54,226,123,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} className="absolute inset-0" />
                  <Trophy size={20} color="#36e27b" style={{ marginTop: 2 }} />
                  <View className="flex-1">
                    <Text className="text-green-100 text-sm leading-relaxed font-body">
                      <Text className="text-white font-bold">Top Category: </Text>
                      {categoryData[0]?.label || 'Shopping'} is your highest expense category at <Text className="text-white font-bold">{formatCurrency(categoryData[0]?.value || 0)}</Text> ({categoryData[0]?.percentage.toFixed(0)}% of total spending).
                    </Text>
                  </View>
                </GlassPanel>

                {/* Spending Alert if applicable */}
                {monthlyTotals.expense > monthlyTotals.income && monthlyTotals.expense > 0 && (
                  <GlassPanel className="p-4 flex-row items-start gap-3 border-l-4 border-l-orange-500 relative overflow-hidden">
                    <LinearGradient colors={['rgba(249,115,22,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} className="absolute inset-0" />
                    <AlertTriangle size={20} color="#F97316" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-orange-100 text-sm leading-relaxed font-body">
                        <Text className="text-white font-bold">Alert: </Text>
                        In {selectedMonthName}, your expenses ({formatCurrency(monthlyTotals.expense)}) exceeded your income ({formatCurrency(monthlyTotals.income)}). Consider reviewing your spending.
                      </Text>
                    </View>
                  </GlassPanel>
                )}

                {/* Positive insight when income > expenses */}
                {monthlyTotals.income > monthlyTotals.expense && monthlyTotals.income > 0 && (
                  <GlassPanel className="p-4 flex-row items-start gap-3 border-l-4 border-l-primary relative overflow-hidden">
                    <LinearGradient colors={['rgba(54,226,123,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} className="absolute inset-0" />
                    <Trophy size={20} color="#36e27b" style={{ marginTop: 2 }} />
                    <View className="flex-1">
                      <Text className="text-green-100 text-sm leading-relaxed font-body">
                        <Text className="text-white font-bold">Great Job! </Text>
                        In {selectedMonthName}, you saved {formatCurrency(monthlyTotals.income - monthlyTotals.expense)}. Keep up the good work!
                      </Text>
                    </View>
                  </GlassPanel>
                )}
              </>
            )}

            {categoryData.length === 0 && (
              <GlassPanel className="p-4 flex-row items-start gap-3">
                <Zap size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm leading-relaxed font-body">
                    Add some transactions to see personalized insights about your spending patterns.
                  </Text>
                </View>
              </GlassPanel>
            )}
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
      </ScrollView >
    </View >
  );
}
