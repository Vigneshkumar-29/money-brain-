import { View, Text, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { LucideIcon, Trash2, Edit2 } from 'lucide-react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useRouter } from 'expo-router';
import { useTransactions } from '../../context/TransactionContext';
import Reanimated, { SharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';

interface TransactionItemProps {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  icon: LucideIcon;
  onPress?: () => void;
}

export default function TransactionItem({ id, title, amount, date, type, category, icon: Icon, onPress }: TransactionItemProps) {
  const router = useRouter();
  const { deleteTransaction } = useTransactions();
  const swipeableRef = React.useRef<any>(null);

  const isExpense = type === 'expense';
  const amountColor = isExpense ? 'text-accent' : 'text-primary';
  const iconColor = isExpense ? '#FF6B6B' : '#2ECC71';
  const iconBgColor = isExpense ? 'rgba(255, 107, 107, 0.1)' : 'rgba(46, 204, 113, 0.1)';

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel", onPress: () => swipeableRef.current?.close() },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(id);
            // Swipeable will be unmounted, no need to close usually
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    swipeableRef.current?.close();
    router.push({ pathname: '/transaction-modal', params: { id } });
  };

  const renderRightActions = (progress: SharedValue<number>, drag: SharedValue<number>) => {
    const style = useAnimatedStyle(() => {
      // drag goes from 0 to -100 (or less) as we swipe left.
      // We want scale 0 -> 1 as drag goes -100 -> 0 ?? No.
      // standard swipe reveal: drag decreases.
      const scale = interpolate(drag.value + 80, [0, 80], [1, 0], Extrapolation.CLAMP);

      // Simpler approach for "reveal": Just keep it static but scalable?
      // Match previous logic: input [-100, 0] -> output [1, 0]
      // drag value is negative when swiping left (revealing right actions)

      const scaleVal = interpolate(
        drag.value,
        [-100, 0],
        [1, 0],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale: scaleVal }],
      };
    });

    return (
      <TouchableOpacity
        onPress={handleDelete}
        className="bg-red-500 justify-center items-center w-[80px] h-full rounded-r-lg"
        activeOpacity={0.8}
      >
        <Reanimated.View style={style}>
          <Trash2 size={24} color="white" />
          <Text className="text-white text-xs font-bold mt-1">Delete</Text>
        </Reanimated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (progress: SharedValue<number>, drag: SharedValue<number>) => {
    const style = useAnimatedStyle(() => {
      // drag goes > 0 when swiping right (revealing left actions)
      // input [0, 100] -> output [0, 1]

      const scaleVal = interpolate(
        drag.value,
        [0, 100],
        [0, 1],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale: scaleVal }],
      };
    });

    return (
      <TouchableOpacity
        onPress={handleEdit}
        className="bg-blue-500 justify-center items-center w-[80px] h-full rounded-l-lg"
        activeOpacity={0.8}
      >
        <Reanimated.View style={style}>
          <Edit2 size={24} color="white" />
          <Text className="text-white text-xs font-bold mt-1">Edit</Text>
        </Reanimated.View>
      </TouchableOpacity>
    );
  };


  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      containerStyle={{ marginBottom: 8, overflow: 'visible' }} // overflow visible for shadows if needed
    >
      <View>
        <TouchableOpacity
          onPress={onPress || handleEdit} // Default to edit on press if no custom action
          className="flex-row items-center justify-between py-3.5 bg-card-light dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-lg px-3 shadow-sm"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center flex-1">
            <View
              className="w-11 h-11 rounded-2xl items-center justify-center mr-3.5"
              style={{ backgroundColor: iconBgColor }}
            >
              <Icon size={22} color={iconColor} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary dark:text-text-dark font-body font-semibold text-base mb-0.5" numberOfLines={1}>{title}</Text>
              <Text className="text-text-secondary font-body text-xs font-medium">{category} • {date}</Text>
            </View>
          </View>
          <Text className={`font-mono font-bold text-base ${amountColor}`}>
            {isExpense ? '-' : '+'}{amount}
          </Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}
