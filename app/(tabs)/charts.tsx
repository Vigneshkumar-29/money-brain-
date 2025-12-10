import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import BarChart from '../../components/charts/BarChart';
import FadeInView from '../../components/ui/FadeInView';

export default function Charts() {
  const weeklyData = [
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 30 },
    { label: 'Wed', value: 60 },
    { label: 'Thu', value: 25 },
    { label: 'Fri', value: 80 },
    { label: 'Sat', value: 55 },
    { label: 'Sun', value: 40 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <FadeInView delay={0}>
          <Text className="text-3xl font-display font-bold text-text-primary dark:text-text-dark mb-8">Spending Overview</Text>
        </FadeInView>
        
        <FadeInView delay={50} className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mb-6">
          <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark mb-5">Weekly Expenses</Text>
          <BarChart data={weeklyData} barColor="#FF6B6B" />
        </FadeInView>

        <FadeInView delay={100} className="bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 mb-6">
          <Text className="text-xl font-display font-bold text-text-primary dark:text-text-dark mb-5">Monthly Income</Text>
          <BarChart 
            data={[
              { label: 'Jan', value: 4000 },
              { label: 'Feb', value: 3500 },
              { label: 'Mar', value: 4200 },
              { label: 'Apr', value: 3800 },
            ]} 
            barColor="#2ECC71" 
          />
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
