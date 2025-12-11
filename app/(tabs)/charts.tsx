import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useMemo } from 'react';
import BarChart from '../../components/charts/BarChart';
import FadeInView from '../../components/ui/FadeInView';
import { useTransactions } from '../../context/TransactionContext';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon, Calendar } from 'lucide-react-native';

type Period = 'week' | 'month' | 'year';

export default function Charts() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const { transactions } = useTransactions();

  // Calculate data based on selected period
  const chartData = useMemo(() => {
    const now = new Date();
    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      } else if (selectedPeriod === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      } else {
        return txDate.getFullYear() === now.getFullYear();
      }
    });

    // Group by day for week, by week for month, by month for year
    const grouped: { [key: string]: { income: number; expense: number } } = {};

    filtered.forEach(tx => {
      const txDate = new Date(tx.date);
      let key: string;

      if (selectedPeriod === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        key = days[txDate.getDay()];
      } else if (selectedPeriod === 'month') {
        const weekNum = Math.ceil(txDate.getDate() / 7);
        key = `Week ${weekNum}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        key = months[txDate.getMonth()];
      }

      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0 };
      }

      if (tx.type === 'income') {
        grouped[key].income += tx.amount;
      } else {
        grouped[key].expense += tx.amount;
      }
    });

    return grouped;
  }, [transactions, selectedPeriod]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'expense');
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        label: category.charAt(0).toUpperCase() + category.slice(1),
        value: amount,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  // Prepare expense chart data
  const expenseChartData = Object.entries(chartData).map(([label, data]) => ({
    label,
    value: data.expense,
  }));

  // Prepare income chart data
  const incomeChartData = Object.entries(chartData).map(([label, data]) => ({
    label,
    value: data.income,
  }));

  // Calculate totals
  const totalExpense = expenseChartData.reduce((sum, item) => sum + item.value, 0);
  const totalIncome = incomeChartData.reduce((sum, item) => sum + item.value, 0);
  const netSavings = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <Text className="text-3xl font-display font-bold text-text-primary dark:text-text-dark mb-2">
            Analytics
          </Text>
          <Text className="text-sm font-body text-text-secondary mb-6">
            Track your spending patterns and insights
          </Text>
        </FadeInView>

        {/* Period Selector */}
        <FadeInView delay={50} className="mb-6">
          <View className="flex-row bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
            {(['week', 'month', 'year'] as Period[]).map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 py-3 rounded-xl items-center active:scale-95 ${selectedPeriod === period ? 'bg-primary shadow-sm' : 'bg-transparent'
                  }`}
              >
                <Text
                  className={`font-body font-bold text-sm ${selectedPeriod === period ? 'text-white' : 'text-text-secondary dark:text-gray-400'
                    }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </FadeInView>

        {/* Summary Cards */}
        <FadeInView delay={100} className="mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-card-light dark:bg-card-dark p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2">
                  <TrendingUp size={16} color="#2ECC71" strokeWidth={2.5} />
                </View>
                <Text className="text-xs font-body font-semibold text-text-secondary uppercase">Income</Text>
              </View>
              <Text className="text-xl font-mono font-bold text-primary">
                {formatCurrency(totalIncome)}
              </Text>
            </View>

            <View className="flex-1 bg-card-light dark:bg-card-dark p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-accent/10 items-center justify-center mr-2">
                  <TrendingDown size={16} color="#FF6B6B" strokeWidth={2.5} />
                </View>
                <Text className="text-xs font-body font-semibold text-text-secondary uppercase">Expenses</Text>
              </View>
              <Text className="text-xl font-mono font-bold text-accent">
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>

          <View className="bg-card-light dark:bg-card-dark p-4 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mt-3">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-body font-semibold text-text-secondary uppercase mb-1">
                  Net Savings
                </Text>
                <Text className={`text-2xl font-mono font-bold ${netSavings >= 0 ? 'text-primary' : 'text-accent'}`}>
                  {formatCurrency(netSavings)}
                </Text>
              </View>
              <View className={`px-4 py-2 rounded-full ${netSavings >= 0 ? 'bg-primary/10' : 'bg-accent/10'}`}>
                <Text className={`text-sm font-body font-bold ${netSavings >= 0 ? 'text-primary' : 'text-accent'}`}>
                  {netSavings >= 0 ? '+' : ''}{((netSavings / (totalIncome || 1)) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Expense Chart */}
        {expenseChartData.length > 0 && (
          <FadeInView delay={150} className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">
                Expenses Trend
              </Text>
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                <TrendingDown size={20} color="#FF6B6B" strokeWidth={2.5} />
              </View>
            </View>
            <BarChart data={expenseChartData} barColor="#FF6B6B" />
          </FadeInView>
        )}

        {/* Income Chart */}
        {incomeChartData.length > 0 && (
          <FadeInView delay={200} className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">
                Income Trend
              </Text>
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <TrendingUp size={20} color="#2ECC71" strokeWidth={2.5} />
              </View>
            </View>
            <BarChart data={incomeChartData} barColor="#2ECC71" />
          </FadeInView>
        )}

        {/* Top Categories */}
        {categoryData.length > 0 && (
          <FadeInView delay={250} className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mb-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark">
                Top Spending Categories
              </Text>
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <PieChartIcon size={20} color="#2ECC71" strokeWidth={2.5} />
              </View>
            </View>
            <View className="space-y-3">
              {categoryData.map((category, index) => {
                const percentage = (category.value / totalExpense) * 100;
                const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA'];
                return (
                  <View key={index}>
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <Text className="text-base font-body font-semibold text-text-primary dark:text-text-dark">
                          {category.label}
                        </Text>
                      </View>
                      <Text className="text-base font-mono font-bold text-text-primary dark:text-text-dark">
                        {formatCurrency(category.value)}
                      </Text>
                    </View>
                    <View className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                    </View>
                    <Text className="text-xs font-body text-text-secondary mt-1 text-right">
                      {percentage.toFixed(1)}% of total
                    </Text>
                  </View>
                );
              })}
            </View>
          </FadeInView>
        )}

        {/* Empty State */}
        {transactions.length === 0 && (
          <FadeInView delay={100} className="bg-card-light dark:bg-card-dark p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 items-center">
            <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
              <Calendar size={32} color="#6B7280" strokeWidth={2} />
            </View>
            <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark mb-2 text-center">
              No Data Yet
            </Text>
            <Text className="text-sm font-body text-text-secondary text-center">
              Start adding transactions to see your analytics and spending patterns
            </Text>
          </FadeInView>
        )}

        <View className="h-32" />
      </ScrollView>
    </SafeAreaView>
  );
}
