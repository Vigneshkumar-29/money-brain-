import { View, Text, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { LucideIcon, Trash2, Edit2 } from 'lucide-react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useRouter } from 'expo-router';
import { useTransactions } from '../../context/TransactionContext';
import Reanimated, { SharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import TransactionActionModal from './TransactionActionModal';

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

// Separate component for right swipe action to avoid hooks in render functions
const RightSwipeAction = React.memo(({ drag, onPress }: { drag: SharedValue<number>, onPress: () => void }) => {
  const animatedStyle = useAnimatedStyle(() => {
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
      onPress={onPress}
      className="bg-red-500 justify-center items-center w-[80px] h-full rounded-r-lg"
      activeOpacity={0.8}
    >
      <Reanimated.View style={animatedStyle}>
        <Trash2 size={24} color="white" />
        <Text className="text-white text-xs font-bold mt-1">Delete</Text>
      </Reanimated.View>
    </TouchableOpacity>
  );
});
RightSwipeAction.displayName = 'RightSwipeAction';

// Separate component for left swipe action to avoid hooks in render functions
const LeftSwipeAction = React.memo(({ drag, onPress }: { drag: SharedValue<number>, onPress: () => void }) => {
  const animatedStyle = useAnimatedStyle(() => {
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
      onPress={onPress}
      className="bg-blue-500 justify-center items-center w-[80px] h-full rounded-l-lg"
      activeOpacity={0.8}
    >
      <Reanimated.View style={animatedStyle}>
        <Edit2 size={24} color="white" />
        <Text className="text-white text-xs font-bold mt-1">Edit</Text>
      </Reanimated.View>
    </TouchableOpacity>
  );
});
LeftSwipeAction.displayName = 'LeftSwipeAction';

export default function TransactionItem({ id, title, amount, date, type, category, icon: Icon, onPress }: TransactionItemProps) {
  const router = useRouter();
  const { deleteTransaction } = useTransactions();
  const swipeableRef = React.useRef<any>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const isExpense = type === 'expense';
  const amountColor = isExpense ? 'text-accent' : 'text-primary';
  const iconColor = isExpense ? '#FF6B6B' : '#2ECC71';
  const iconBgColor = isExpense ? 'rgba(255, 107, 107, 0.1)' : 'rgba(46, 204, 113, 0.1)';

  const handleDelete = React.useCallback(() => {
    setShowActionModal(false);
    // Small delay to allow modal to close before showing alert
    setTimeout(() => {
      Alert.alert(
        "Delete Transaction",
        "Are you sure you want to delete this transaction?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => swipeableRef.current?.close()
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteTransaction(id);
            }
          }
        ]
      );
    }, 300);
  }, [id, deleteTransaction]);

  const handleEdit = React.useCallback(() => {
    setShowActionModal(false);
    swipeableRef.current?.close();
    router.push({ pathname: '/transaction-modal', params: { id } });
  }, [id, router]);

  // Show action modal when transaction is tapped
  const handleTransactionPress = React.useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      setShowActionModal(true);
    }
  }, [onPress]);

  const renderRightActions = React.useCallback((_progress: SharedValue<number>, drag: SharedValue<number>) => {
    return <RightSwipeAction drag={drag} onPress={handleDelete} />;
  }, [handleDelete]);

  const renderLeftActions = React.useCallback((_progress: SharedValue<number>, drag: SharedValue<number>) => {
    return <LeftSwipeAction drag={drag} onPress={handleEdit} />;
  }, [handleEdit]);

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        containerStyle={{ marginBottom: 8, overflow: 'visible' }}
      >
        <View>
          <TouchableOpacity
            onPress={handleTransactionPress}
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

      {/* Action Modal */}
      <TransactionActionModal
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        title={title}
        amount={amount}
        category={category}
        date={date}
        isExpense={isExpense}
      />
    </>
  );
}
