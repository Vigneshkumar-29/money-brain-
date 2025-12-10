import { View, Text } from 'react-native';
import React from 'react';
import { LucideIcon } from 'lucide-react-native';

interface MetricCardProps {
  title: string;
  amount: string;
  icon: LucideIcon;
  type: 'balance' | 'income' | 'expense';
}

export default function MetricCard({ title, amount, icon: Icon, type }: MetricCardProps) {
  const getIconColor = () => {
    switch (type) {
      case 'income':
        return '#2ECC71';
      case 'expense':
        return '#FF6B6B';
      default:
        return '#0F1419'; // Default text color
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'income':
        return 'rgba(46, 204, 113, 0.1)';
      case 'expense':
        return 'rgba(255, 107, 107, 0.1)';
      default:
        return 'rgba(15, 20, 25, 0.05)';
    }
  };

  return (
    <View className="bg-card-light dark:bg-card-dark p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 flex-1 mx-1 justify-between min-h-[140px]">
      <View className="flex-row justify-between items-start mb-3">
        <View 
          className="p-3 rounded-full"
          style={{ backgroundColor: getIconBgColor() }}
        >
          <Icon size={22} color={getIconColor()} strokeWidth={2.5} />
        </View>
      </View>
      <View>
        <Text className="text-text-secondary font-body text-xs font-semibold mb-2 uppercase tracking-wide">{title}</Text>
        <Text className="text-text-primary dark:text-text-dark text-2xl font-mono font-bold" numberOfLines={1} adjustsFontSizeToFit>
          {amount}
        </Text>
      </View>
    </View>
  );
}
