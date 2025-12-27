import { View, Text, ScrollView, Pressable, Platform, Alert, ActivityIndicator } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context'; // Unused
import React, { useState, useMemo } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { exportToPDF, exportToCSV } from '../../utils/exportData';
import { generateInsights, Insight } from '../../utils/aiInsights';
import { InteractiveBarChart, InteractiveCategoryChart } from '../../components/charts/InteractiveCharts';
import {
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  Zap,
  AlertTriangle,
  Trophy,
  FileText,
  TableProperties,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lightbulb,
  Calendar,
  Target,
  DollarSign,
  BarChart3
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
  const { transactions } = useTransactions(); // totals unused
  const { profile, user } = useAuth();
  const { formatCurrency, getCategoryById } = usePreferences();

  // Get current month as default
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentMonthIndex);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

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

  // Calculate percentages for "Spending Mix" - using filtered transactions
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(tx => tx.type === 'expense');
    const totalExp = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => {
        const categoryInfo = getCategoryById(category);
        return {
          label: categoryInfo?.label || category.charAt(0).toUpperCase() + category.slice(1),
          value: amount,
          percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
          color: categoryInfo?.color || '#9CA3AF'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [filteredTransactions, getCategoryById]);

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

  // AI-powered insights analysis
  const aiAnalysis = useMemo(() => {
    return generateInsights(
      filteredTransactions,
      transactions,
      selectedMonthIndex,
      selectedYear,
      monthlyTotals
    );
  }, [filteredTransactions, transactions, selectedMonthIndex, selectedYear, monthlyTotals]);

  // Helper function to get icon for insight type
  const getInsightIcon = (iconType: string, color: string) => {
    const iconProps = { size: 20, color, style: { marginTop: 2 } };
    switch (iconType) {
      case 'trophy': return <Trophy {...iconProps} />;
      case 'alert': return <AlertTriangle {...iconProps} />;
      case 'trending': return <TrendingUp {...iconProps} />;
      case 'lightbulb': return <Lightbulb {...iconProps} />;
      case 'calendar': return <Calendar {...iconProps} />;
      case 'target': return <Target {...iconProps} />;
      case 'money': return <DollarSign {...iconProps} />;
      case 'chart': return <BarChart3 {...iconProps} />;
      default: return <Zap {...iconProps} />;
    }
  };

  // Get color for insight type
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return { border: 'border-l-primary', gradient: 'rgba(54,226,123,0.1)', text: 'text-green-100', icon: '#36e27b' };
      case 'warning': return { border: 'border-l-orange-500', gradient: 'rgba(249,115,22,0.1)', text: 'text-orange-100', icon: '#F97316' };
      case 'tip': return { border: 'border-l-blue-500', gradient: 'rgba(59,130,246,0.1)', text: 'text-blue-100', icon: '#3B82F6' };
      case 'info':
      default: return { border: 'border-l-purple-500', gradient: 'rgba(168,85,247,0.1)', text: 'text-purple-100', icon: '#A855F7' };
    }
  };

  // Export handlers
  const handleExportPDF = async () => {
    if (exportingPDF) return;

    if (filteredTransactions.length === 0) {
      Alert.alert('No Data', `No transactions found for ${selectedMonthName} ${selectedYear} to export.`);
      return;
    }

    setExportingPDF(true);
    try {
      await exportToPDF(
        filteredTransactions,
        selectedMonthName,
        selectedYear,
        monthlyTotals,
        username
      );
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (exportingCSV) return;

    if (filteredTransactions.length === 0) {
      Alert.alert('No Data', `No transactions found for ${selectedMonthName} ${selectedYear} to export.`);
      return;
    }

    setExportingCSV(true);
    try {
      await exportToCSV(
        filteredTransactions,
        selectedMonthName,
        selectedYear,
        monthlyTotals
      );
    } finally {
      setExportingCSV(false);
    }
  };

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

            {/* Interactive Weekly Bar Chart */}
            <InteractiveBarChart
              data={weeklyData.map((week, index) => ({
                label: `Wk ${index + 1}`,
                income: week.income,
                expense: week.expense,
              }))}
              height={180}
              formatCurrency={formatCurrency}
            />

            <Text className="text-gray-500 text-xs text-center mt-4 font-display">
              Tap on bars to see week details
            </Text>
          </GlassPanel>
        </View>

        {/* Spending Mix Chart */}
        <View className="px-6 mb-6">
          <GlassPanel className="p-6">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 font-display">Spending Mix</Text>
                <Text className="text-white text-2xl font-bold font-display">
                  {formatCurrency(monthlyTotals.expense)} <Text className="text-gray-400 font-normal text-lg">Out</Text>
                </Text>
              </View>
              <View className="bg-white/10 px-3 py-1.5 rounded-full">
                <Text className="text-xs text-gray-300 font-display">
                  {categoryData.length} Categories
                </Text>
              </View>
            </View>

            {/* Interactive Category Chart */}
            <InteractiveCategoryChart
              data={categoryData}
              formatCurrency={formatCurrency}
              totalExpense={monthlyTotals.expense}
            />

            {categoryData.length > 0 && (
              <Text className="text-gray-500 text-xs text-center mt-4 font-display">
                Tap on categories to see details
              </Text>
            )}
          </GlassPanel>
        </View>

        {/* AI Insights */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Zap size={20} color="#36e27b" />
              <Text className="text-white text-lg font-bold font-display">AI Insights</Text>
            </View>
            {aiAnalysis.insights.length > 0 && (
              <View className="flex-row items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Text className="text-xs text-gray-300">Health Score</Text>
                <Text className={`text-sm font-bold ${aiAnalysis.healthScore >= 70 ? 'text-green-400' :
                  aiAnalysis.healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                  {aiAnalysis.healthScore}
                </Text>
              </View>
            )}
          </View>

          <View className="gap-3">
            {/* Render dynamic AI insights */}
            {aiAnalysis.insights.length > 0 ? (
              <>
                {aiAnalysis.insights.map((insight) => {
                  const colors = getInsightColor(insight.type);
                  return (
                    <GlassPanel
                      key={insight.id}
                      className={`p-4 flex-row items-start gap-3 border-l-4 ${colors.border} relative overflow-hidden`}
                    >
                      <LinearGradient
                        colors={[colors.gradient, 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.8, y: 0 }}
                        className="absolute inset-0"
                      />
                      {getInsightIcon(insight.icon, colors.icon)}
                      <View className="flex-1">
                        <Text className={`${colors.text} text-sm leading-relaxed font-body`}>
                          <Text className="text-white font-bold">{insight.title} </Text>
                          {insight.message}
                        </Text>
                      </View>
                    </GlassPanel>
                  );
                })}

                {/* Spending Trend Indicator */}
                {aiAnalysis.spendingTrend !== 'stable' && (
                  <GlassPanelHighlight className="p-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      {aiAnalysis.spendingTrend === 'increasing' ? (
                        <TrendingUp size={20} color="#F97316" />
                      ) : (
                        <TrendingDown size={20} color="#36e27b" />
                      )}
                      <Text className="text-white text-sm font-body">
                        Spending Trend: <Text className="font-bold capitalize">{aiAnalysis.spendingTrend}</Text>
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${aiAnalysis.spendingTrend === 'increasing' ? 'bg-orange-500/20' : 'bg-green-500/20'
                      }`}>
                      <Text className={`text-xs font-bold ${aiAnalysis.spendingTrend === 'increasing' ? 'text-orange-400' : 'text-green-400'
                        }`}>
                        {aiAnalysis.spendingTrend === 'increasing' ? '↑' : '↓'}
                      </Text>
                    </View>
                  </GlassPanelHighlight>
                )}
              </>
            ) : (
              <GlassPanel className="p-4 flex-row items-start gap-3">
                <Zap size={20} color="#9CA3AF" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm leading-relaxed font-body">
                    Add some transactions to see personalized AI insights about your spending patterns, savings potential, and financial trends.
                  </Text>
                </View>
              </GlassPanel>
            )}
          </View>
        </View>

        {/* Export Actions */}
        <View className="px-6 mb-8 flex-row gap-4">
          <Pressable
            onPress={handleExportPDF}
            disabled={exportingPDF}
            className={`flex-1 h-12 rounded-xl border border-white/10 bg-white/5 flex-row items-center justify-center gap-2 active:scale-95 transition-transform ${exportingPDF ? 'opacity-60' : ''}`}
          >
            {exportingPDF ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FileText size={20} color="white" />
            )}
            <Text className="text-white text-sm font-bold font-display">
              {exportingPDF ? 'Exporting...' : 'Export PDF'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleExportCSV}
            disabled={exportingCSV}
            className={`flex-1 h-12 rounded-xl border border-white/10 bg-white/5 flex-row items-center justify-center gap-2 active:scale-95 transition-transform ${exportingCSV ? 'opacity-60' : ''}`}
          >
            {exportingCSV ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <TableProperties size={20} color="white" />
            )}
            <Text className="text-white text-sm font-bold font-display">
              {exportingCSV ? 'Exporting...' : 'Export CSV'}
            </Text>
          </Pressable>
        </View>
      </ScrollView >
    </View >
  );
}
