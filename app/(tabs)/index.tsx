import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import MetricCard from '../../components/dashboard/MetricCard';
import TransactionPreview from '../../components/dashboard/TransactionPreview';
import FAB from '../../components/ui/FAB';
import FadeInView from '../../components/ui/FadeInView';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <Text className="text-3xl font-display font-bold text-text-primary dark:text-text-dark mb-8">Dashboard</Text>
        </FadeInView>
        
        <FadeInView delay={50} className="flex-row justify-between mb-4">
          <MetricCard 
            title="Total Balance" 
            amount="$12,450.00" 
            icon={Wallet} 
            type="balance" 
          />
        </FadeInView>

        <View className="flex-row justify-between mb-4">
          <FadeInView delay={100} className="flex-1">
            <MetricCard 
              title="Income" 
              amount="$4,250.00" 
              icon={TrendingUp} 
              type="income" 
            />
          </FadeInView>
          <FadeInView delay={150} className="flex-1">
            <MetricCard 
              title="Expenses" 
              amount="$1,850.00" 
              icon={TrendingDown} 
              type="expense" 
            />
          </FadeInView>
        </View>

        <FadeInView delay={200}>
          <TransactionPreview />
        </FadeInView>
        
        <View className="h-32" /> 
      </ScrollView>
      <FAB onPress={() => router.push('/transaction-modal')} />
    </SafeAreaView>
  );
}
