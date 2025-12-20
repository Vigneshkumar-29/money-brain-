import { View, Text, TextInput, Pressable, ScrollView, Platform, SectionList, Alert } from 'react-native';
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
  Tag,
  Car
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { rfs, rs, getIconSize, getContainerPadding, spacing, typography } from '../../lib/responsive';
import TransactionActionModal from '../../components/transactions/TransactionActionModal';

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

const GlassInput = ({ children, className = "", style = {} }: { children: React.ReactNode, className?: string, style?: any }) => (
  <View className={`overflow-hidden rounded-full border border-white/5 ${className}`} style={style}>
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
  const { transactions, totals, deleteTransaction, loadMore, hasMore, loading } = useTransactions();

  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  // Handler functions
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleEdit = () => {
    setModalVisible(false);
    if (selectedTransaction) {
      router.push({ pathname: '/transaction-modal', params: { id: selectedTransaction.id } });
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;

    setModalVisible(false);

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${selectedTransaction.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting delete for transaction:', selectedTransaction.id);
              await deleteTransaction(selectedTransaction.id);
              console.log('Delete completed successfully');

              // Clear selection after successful delete
              setSelectedTransaction(null);

              Alert.alert(
                'Success',
                'Transaction deleted successfully',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('Delete failed:', error);

              // Provide detailed error message
              const errorMessage = error?.message || 'Failed to delete transaction. Please try again.';
              Alert.alert(
                'Error',
                errorMessage,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTransaction(null);
  };

  const containerPadding = getContainerPadding();
  const iconSize = getIconSize(24);
  const smallIconSize = getIconSize(20);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Top Navigation Bar */}
      <View style={{ paddingTop: rs(56), paddingBottom: rs(16), paddingHorizontal: containerPadding }} className="flex-row items-center justify-between z-10 sticky top-0 bg-background-dark/95">
        <Pressable
          onPress={() => router.back()}
          style={{ width: rs(40), height: rs(40) }}
          className="items-center justify-center rounded-full active:bg-white/10"
        >
          <ArrowLeft size={iconSize} color="white" />
        </Pressable>
        <Text style={{ fontSize: typography.lg }} className="font-bold uppercase tracking-widest text-white/90 font-display">Wallet</Text>
        <Pressable
          onPress={() => router.push('/transaction-modal')}
          style={{ width: rs(40), height: rs(40) }}
          className="items-center justify-center rounded-full bg-white/5 border border-white/10 active:bg-primary"
        >
          <Plus size={iconSize} color="white" />
        </Pressable>
      </View>

      {/* Wallet Balance Overview */}
      <View style={{ paddingHorizontal: containerPadding, marginTop: spacing.md }}>
        <GlassPanel style={{ padding: spacing['2xl'], position: 'relative', overflow: 'hidden' }}>
          {/* Decorative Glow */}
          <View className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />

          <View className="relative z-10">
            {/* Total Balance */}
            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontSize: typography.sm }} className="text-gray-400 font-medium mb-2 font-display">Total Balance</Text>
              <Text style={{ fontSize: rfs(36) }} className="text-white font-bold tracking-tight font-display">
                {formatCurrency(totals.balance)}
              </Text>
            </View>

            {/* Income & Expense Stats */}
            <View className="flex-row gap-4">
              {/* Income */}
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <View style={{ width: rs(8), height: rs(8) }} className="rounded-full bg-emerald-500" />
                  <Text style={{ fontSize: typography.xs }} className="text-gray-400 uppercase tracking-wider font-bold font-display">Income</Text>
                </View>
                <Text style={{ fontSize: typography.lg }} className="text-emerald-400 font-bold font-mono">
                  +{formatCurrency(totals.income)}
                </Text>
              </View>

              {/* Expense */}
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-2">
                  <View style={{ width: rs(8), height: rs(8) }} className="rounded-full bg-rose-500" />
                  <Text style={{ fontSize: typography.xs }} className="text-gray-400 uppercase tracking-wider font-bold font-display">Expense</Text>
                </View>
                <Text style={{ fontSize: typography.lg }} className="text-rose-400 font-bold font-mono">
                  -{formatCurrency(totals.expense)}
                </Text>
              </View>
            </View>
          </View>
        </GlassPanel>
      </View>

      {/* Main Content Area */}
      <SectionList
        sections={groupedTransactions}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: rs(100) }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !loading) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            {/* Transaction History Header */}
            <View style={{ paddingHorizontal: containerPadding, marginTop: spacing['2xl'], marginBottom: spacing.md }}>
              <Text style={{ fontSize: typography.xl }} className="font-bold text-white font-display">Transaction History</Text>
              <Text style={{ fontSize: typography.sm, marginTop: spacing.xs }} className="text-gray-400 font-display">
                {transactions.length} transactions loaded
              </Text>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: containerPadding, marginTop: spacing.lg }}>
              <GlassInput style={{ height: rs(48) }} className="flex-row w-full items-center">
                <View style={{ paddingLeft: spacing.lg, paddingRight: spacing.sm }}>
                  <Search size={smallIconSize} color="#95c6a9" />
                </View>
                <TextInput
                  className="flex-1 text-white h-full font-body"
                  style={{ fontSize: typography.base }}
                  placeholder="Search transactions..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={search}
                  onChangeText={setSearch}
                />
              </GlassInput>
            </View>

            {/* Filter Chips */}
            <View style={{ marginTop: spacing['2xl'], marginBottom: spacing['2xl'], paddingLeft: containerPadding }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: containerPadding, gap: spacing.md }}>
                <Pressable
                  onPress={() => setFilterType('All')}
                  style={{ height: rs(36), paddingHorizontal: spacing.lg }}
                  className={`rounded-full items-center justify-center border ${filterType === 'All' ? 'bg-primary/20 border-primary/50' : 'bg-transparent border-white/10'}`}
                >
                  <Text style={{ fontSize: typography.sm }} className={`${filterType === 'All' ? 'text-primary' : 'text-white/70'} font-bold`}>All</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterType('Expense')}
                  style={{ height: rs(36), paddingHorizontal: spacing.lg }}
                  className={`rounded-full items-center justify-center border ${filterType === 'Expense' ? 'bg-primary/20 border-primary/50' : 'bg-transparent border-white/10'}`}
                >
                  <Text style={{ fontSize: typography.sm }} className={`${filterType === 'Expense' ? 'text-primary' : 'text-white/70'} font-bold`}>Expense</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilterType('Income')}
                  style={{ height: rs(36), paddingHorizontal: spacing.lg }}
                  className={`rounded-full items-center justify-center border ${filterType === 'Income' ? 'bg-primary/20 border-primary/50' : 'bg-transparent border-white/10'}`}
                >
                  <Text style={{ fontSize: typography.sm }} className={`${filterType === 'Income' ? 'text-primary' : 'text-white/70'} font-bold`}>Income</Text>
                </Pressable>

                <GlassPanel style={{ height: rs(36), paddingHorizontal: spacing.lg }} className="flex-row items-center justify-center gap-2 rounded-full">
                  <Tag size={getIconSize(16)} color={filterType === 'Category' ? '#36e27b' : '#36e27b'} />
                  <Text style={{ fontSize: typography.sm }} className="text-white/70 font-medium">Category</Text>
                </GlassPanel>

                <GlassPanel style={{ height: rs(36), paddingHorizontal: spacing.lg }} className="flex-row items-center justify-center gap-2 rounded-full">
                  <Calendar size={getIconSize(16)} color="#36e27b" />
                  <Text style={{ fontSize: typography.sm }} className="text-white/70 font-medium">Date</Text>
                </GlassPanel>
              </ScrollView>
            </View>
          </>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingHorizontal: containerPadding, paddingVertical: spacing.sm, backgroundColor: 'transparent' }}>
            <Text style={{ fontSize: typography.xs, marginLeft: spacing.sm }} className="font-bold text-gray-500 uppercase tracking-[0.2em] font-display">{title}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <View style={{ paddingHorizontal: containerPadding, marginBottom: spacing.md }}>
              <GlassPanel
                style={{ padding: spacing.lg, gap: spacing.lg }}
                className="flex-row items-center justify-between active:scale-[0.98]"
                onPress={() => handleTransactionPress(item)}
              >
                <View style={{ gap: spacing.lg }} className="flex-row items-center flex-1 overflow-hidden">
                  <View style={{ width: rs(48), height: rs(48) }} className={`items-center justify-center rounded-full shrink-0 border ${item.type === 'income' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                    <Icon size={iconSize} color={item.type === 'income' ? '#36e27b' : 'rgba(255,255,255,0.8)'} />
                  </View>
                  <View className="flex-1 justify-center">
                    <Text style={{ fontSize: typography.base }} className="text-white font-bold leading-tight truncate font-display" numberOfLines={1}>{item.title}</Text>
                    <Text style={{ fontSize: typography.xs, marginTop: spacing.xs }} className={`${item.type === 'income' ? 'text-[#95c6a9]' : 'text-white/50'} font-normal truncate font-body`} numberOfLines={1}>
                      {item.category} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                <View className="shrink-0 text-right">
                  <Text style={{ fontSize: typography.base }} className={`${item.type === 'income' ? 'text-primary' : 'text-red-500'} font-bold leading-normal font-display`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                  </Text>
                </View>
              </GlassPanel>
            </View>
          );
        }}
        ListEmptyComponent={
          transactions.length === 0 ? (
            <View style={{ paddingVertical: spacing['4xl'] }} className="items-center justify-center opacity-50">
              <Text style={{ fontSize: typography.base }} className="text-white font-display">No transactions found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && transactions.length > 0 ? (
            <View className="py-4 items-center">
              <Text className="text-gray-400 text-xs">Loading more...</Text>
            </View>
          ) : <View style={{ height: rs(20) }} />
        }
      />

      {/* Transaction Action Modal */}
      {selectedTransaction && (
        <TransactionActionModal
          visible={modalVisible}
          onClose={handleCloseModal}
          onEdit={handleEdit}
          onDelete={handleDelete}
          title={selectedTransaction.title}
          amount={formatCurrency(selectedTransaction.amount)}
          category={selectedTransaction.category}
          date={new Date(selectedTransaction.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
          isExpense={selectedTransaction.type === 'expense'}
        />
      )}
    </View>
  );
}
