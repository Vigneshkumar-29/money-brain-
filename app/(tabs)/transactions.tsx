import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import SearchBar from '../../components/ui/SearchBar';
import SegmentedControl from '../../components/ui/SegmentedControl';
import TransactionItem from '../../components/transactions/TransactionItem';
import FadeInView from '../../components/ui/FadeInView';
import { ShoppingBag, Coffee, ArrowUpRight, Home, Car, Smartphone } from 'lucide-react-native';

const MOCK_TRANSACTIONS = [
  { id: '1', title: 'Grocery Store', amount: '$45.20', date: 'Today', type: 'expense', category: 'Groceries', icon: ShoppingBag },
  { id: '2', title: 'Morning Coffee', amount: '$4.50', date: 'Today', type: 'expense', category: 'Food & Drink', icon: Coffee },
  { id: '3', title: 'Freelance Payment', amount: '$250.00', date: 'Yesterday', type: 'income', category: 'Income', icon: ArrowUpRight },
  { id: '4', title: 'Rent Payment', amount: '$1,200.00', date: 'Oct 1', type: 'expense', category: 'Housing', icon: Home },
  { id: '5', title: 'Gas Station', amount: '$45.00', date: 'Sep 28', type: 'expense', category: 'Transport', icon: Car },
  { id: '6', title: 'Phone Bill', amount: '$60.00', date: 'Sep 25', type: 'expense', category: 'Utilities', icon: Smartphone },
] as const;

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [filterIndex, setFilterIndex] = useState(0);
  const filters = ['All', 'Expense', 'Income'];

  const filteredTransactions = MOCK_TRANSACTIONS.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) || 
                          tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterIndex === 0 || 
                          (filterIndex === 1 && tx.type === 'expense') || 
                          (filterIndex === 2 && tx.type === 'income');
    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-5 pt-6">
        <FadeInView delay={0}>
          <Text className="text-3xl font-display font-bold text-text-primary dark:text-text-dark mb-8">Transactions</Text>
        </FadeInView>
        
        <FadeInView delay={50} className="mb-4">
          <SearchBar value={search} onChangeText={setSearch} />
        </FadeInView>
        
        <FadeInView delay={100} className="mb-6">
          <SegmentedControl 
            values={filters} 
            selectedIndex={filterIndex} 
            onChange={setFilterIndex} 
          />
        </FadeInView>

        <FadeInView delay={150} className="flex-1">
          <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              title={item.title}
              amount={item.amount}
              date={item.date}
              type={item.type}
              category={item.category}
              icon={item.icon}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
        </FadeInView>
      </View>
    </SafeAreaView>
  );
}
