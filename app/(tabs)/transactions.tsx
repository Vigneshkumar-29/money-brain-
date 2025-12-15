import { View, Text, TextInput, Pressable, ScrollView, Platform, SectionList } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useTransactions, Transaction } from '../../context/TransactionContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Music,
  Utensils,
  ShoppingBag,
  CreditCard,
  Briefcase,
  Smartphone,
  Home,
  Zap,
  Coffee,
  Tag
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const GlassPanel = ({ children, className = "", style = {}, onPress }: { children: React.ReactNode, className?: string, style?: any, onPress?: () => void }) => {
  const Container = onPress ? Pressable : View;
  return (
    <Container className={`overflow-hidden rounded-2xl border border-white/10 ${className}`} style={style} onPress={onPress}>
      <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint="dark" className="absolute inset-0" />
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      {children}
    </Container>
  );
};

const GlassInput = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <View className={`overflow-hidden rounded-full border border-white/5 ${className}`}>
    <BlurView intensity={Platform.OS === 'ios' ? 10 : 80} tint="dark" className="absolute inset-0" />
    <LinearGradient
      colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="absolute inset-0"
    />
    {children}
  </View>
);

export default function TransactionsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const { transactions, totals } = useTransactions();

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('restaurant')) return Utensils;
    if (cat.includes('shopping') || cat.includes('store')) return ShoppingBag;
    if (cat.includes('transport') || cat.includes('uber')) return Car;
    if (cat.includes('work') || cat.includes('salary') || cat.includes('freelance')) return Briefcase;
    if (cat.includes('tech') || cat.includes('phone') || cat.includes('electronics')) return Smartphone;
    if (cat.includes('subscription') || cat.includes('spotify') || cat.includes('netflix')) return Music;
    if (cat.includes('home') || cat.includes('rent')) return Home;
    if (cat.includes('utility') || cat.includes('bill')) return Zap;
    return Tag;
  };

  const getIconColor = (category: string, type: string) => {
    if (type === 'income') return '#36e27b';
    return '#E5E7EB'; // Text secondary equivalent roughly
  };

  const getIconBg = (category: string, type: string) => {
    if (type === 'income') return 'bg-primary/10 border-primary/30';
    return 'bg-white/5 border-white/10';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterType === 'All' ||
        (filterType === 'Expense' && tx.type === 'expense') ||
        (filterType === 'Income' && tx.type === 'income');
      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filterType]);

  const groupedTransactions = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
    };

    const grouped: { title: string, data: Transaction[] }[] = [];
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      let key = '';
      if (isSameDay(txDate, today)) {
        key = 'Today';
      } else if (isSameDay(txDate, yesterday)) {
        key = 'Yesterday';
      } else {
        key = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    // Helper to sort keys to ensure Today/Yesterday come first, then others desc
    const keys = Object.keys(groups);
    const sortedKeys = keys.sort((a, b) => {
      if (a === 'Today') return -1;
      if (b === 'Today') return 1;
      if (a === 'Yesterday') return -1;
      if (b === 'Yesterday') return 1;
      // For other dates, we might want to parse and sort, but they are localized strings now.
      // Assuming transactions comes sorted by date desc from context, the iteration order should ideally strictly preserve that if we didn't use a hash map.
      // Since we are using a hash map, order isn't guaranteed.
      // Let's rely on the transaction date of the first item in the group.
      const dateA = new Date(groups[a][0].date).getTime();
      const dateB = new Date(groups[b][0].date).getTime();
      return dateB - dateA;
    });

    sortedKeys.forEach(key => {
      grouped.push({ title: key, data: groups[key] });
    });

    return grouped;
  }, [filteredTransactions]);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between z-10 sticky top-0 bg-background-dark/95">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:bg-white/10"
        >
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text className="text-lg font-bold uppercase tracking-widest text-white/90 font-display">Transactions</Text>
        <Pressable
          onPress={() => router.push('/transaction-modal')}
          className="w-10 h-10 items-center justify-center rounded-full bg-white/5 border border-white/10 active:bg-primary"
        >
          <Plus size={24} color="white" />
        </Pressable>
      </View>

      {/* Main Content Area */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-6 mt-4">
          <GlassInput className="flex-row w-full items-center h-12">
            <View className="pl-4 pr-2">
              <Search size={20} color="#95c6a9" />
            </View>
            <TextInput
              className="flex-1 text-white h-full text-base font-body"
              placeholder="Search transactions..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={search}
              onChangeText={setSearch}
            />
          </GlassInput>
        </View>

        {/* Filter Chips */}
        <View className="mt-6 pl-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 24, gap: 12 }}>
            <Pressable
              onPress={() => setFilterType('All')}
              className={`h-9 px-5 rounded-full items-center justify-center border ${filterType === 'All' ? 'bg-primary/20 border-primary/50' : 'bg-transparent border-white/10'}`}
            >
              <Text className={`${filterType === 'All' ? 'text-primary' : 'text-white/70'} text-sm font-bold`}>All</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterType('Expense')}
              className={`h-9 px-5 rounded-full items-center justify-center border ${filterType === 'Expense' ? 'bg-primary/20 border-primary/50' : 'bg-transparent border-white/10'}`}
            >
              <Text className={`${filterType === 'Expense' ? 'text-primary' : 'text-white/70'} text-sm font-bold`}>Expense</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterType('Income')}
              className={`h-9 px-5 rounded-full items-center justify-center border ${filterType === 'Income' ? 'bg-primary/20 border-primary/50' : 'bg-transparent border-white/10'}`}
            >
              <Text className={`${filterType === 'Income' ? 'text-primary' : 'text-white/70'} text-sm font-bold`}>Income</Text>
            </Pressable>

            <GlassPanel className="h-9 px-5 flex-row items-center justify-center gap-2 rounded-full">
              <Tag size={16} color={filterType === 'Category' ? '#36e27b' : '#36e27b'} />
              <Text className="text-white/70 text-sm font-medium">Category</Text>
            </GlassPanel>

            <GlassPanel className="h-9 px-5 flex-row items-center justify-center gap-2 rounded-full">
              <Calendar size={16} color="#36e27b" />
              <Text className="text-white/70 text-sm font-medium">Date</Text>
            </GlassPanel>
          </ScrollView>
        </View>

        {/* Transactions List */}
        <View className="mt-6 px-6 gap-6">
          {groupedTransactions.map((group, groupIndex) => (
            <View key={group.title || groupIndex} className="gap-3">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] ml-2 font-display">{group.title}</Text>
              {group.data.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const isIncome = item.type === 'income' || item.type === 'lent'; // Treating lent as positive cash flow visual for now if desired, or handle differently

                return (
                  <GlassPanel
                    key={item.id}
                    className="p-4 flex-row items-center justify-between gap-4 active:scale-[0.98]"
                    onPress={() => router.push({ pathname: '/transaction-modal', params: { id: item.id } })}
                  >
                    <View className="flex-row items-center gap-4 flex-1 overflow-hidden">
                      <View className={`items-center justify-center rounded-full shrink-0 w-12 h-12 border ${item.type === 'income' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                        <Icon size={24} color={item.type === 'income' ? '#36e27b' : 'rgba(255,255,255,0.8)'} />
                      </View>
                      <View className="flex-1 justify-center">
                        <Text className="text-white text-base font-bold leading-tight truncate font-display" numberOfLines={1}>{item.title}</Text>
                        <Text className={`${item.type === 'income' ? 'text-[#95c6a9]' : 'text-white/50'} text-xs font-normal mt-1 truncate font-body`} numberOfLines={1}>
                          {item.category} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    <View className="shrink-0 text-right">
                      <Text className={`${item.type === 'income' ? 'text-primary' : 'text-red-500'} text-base font-bold leading-normal font-display`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </Text>
                    </View>
                  </GlassPanel>
                );
              })}
            </View>
          ))}

          {transactions.length === 0 && (
            <View className="items-center justify-center py-10 opacity-50">
              <Text className="text-white font-display">No transactions found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Dashboard Stats (Footer) */}
      <View className="absolute bottom-[92px] left-0 w-full px-4 z-20">
        <GlassPanel className="p-5 flex-row justify-between items-center bg-[#112117]/80 rounded-3xl">
          {/* Income */}
          <View className="flex-col gap-1 w-1/3 border-r border-white/10">
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" style={{ shadowColor: '#36e27b', shadowOpacity: 0.5, shadowRadius: 5 }} />
              <Text className="text-[10px] text-gray-400 uppercase tracking-wider font-bold font-display">Income</Text>
            </View>
            <Text className="text-white font-bold text-sm tracking-tight font-mono">+{formatCurrency(totals.income)}</Text>
          </View>

          {/* Expense */}
          <View className="flex-col gap-1 w-1/3 border-r border-white/10 pl-4">
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ shadowColor: '#ef4444', shadowOpacity: 0.5, shadowRadius: 5 }} />
              <Text className="text-[10px] text-gray-400 uppercase tracking-wider font-bold font-display">Expense</Text>
            </View>
            <Text className="text-white font-medium text-sm tracking-tight font-mono">-{formatCurrency(totals.expense)}</Text>
          </View>

          {/* Balance */}
          <View className="flex-col gap-1 w-1/3 items-end">
            <Text className="text-[10px] text-gray-400 uppercase tracking-wider font-bold font-display">Balance</Text>
            <Text className="text-primary font-bold text-lg tracking-tight font-mono" style={{ shadowColor: '#36e27b', shadowOpacity: 0.3, shadowRadius: 8 }}>
              {formatCurrency(totals.balance)}
            </Text>
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}
