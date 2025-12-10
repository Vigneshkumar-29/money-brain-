import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';

interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ values, selectedIndex, onChange }: SegmentedControlProps) {
  return (
    <View className="flex-row bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-1.5 shadow-sm">
      {values.map((value, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={value}
            onPress={() => onChange(index)}
            className={`flex-1 py-2.5 rounded-xl items-center active:scale-95 ${isSelected ? 'bg-primary shadow-md' : ''}`}
            activeOpacity={0.7}
          >
            <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-text-secondary'}`}>
              {value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
