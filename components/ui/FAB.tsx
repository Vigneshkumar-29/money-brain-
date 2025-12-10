import { TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Plus } from 'lucide-react-native';

interface FABProps {
  onPress: () => void;
}

export default function FAB({ onPress }: FABProps) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="absolute bottom-8 right-6 w-16 h-16 bg-primary rounded-full items-center justify-center shadow-2xl z-50 active:scale-95"
      activeOpacity={0.9}
      style={{
        shadowColor: '#2ECC71',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Plus size={28} color="#FFFFFF" strokeWidth={3} />
    </TouchableOpacity>
  );
}
