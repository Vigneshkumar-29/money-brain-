import { ShoppingBag, Coffee, ArrowUpRight, Home, Car, Smartphone, Utensils, Zap, Tag, DollarSign } from 'lucide-react-native';

// Map icon string names to Lucide components for rendering
export const ICON_MAP: any = {
    ShoppingBag, Coffee, ArrowUpRight, Home, Car, Smartphone, Utensils, Zap, Tag, DollarSign
};

// Helper to map category to icon name (simplified)
export const getCategoryIconName = (category: string) => {
    switch (category.toLowerCase()) {
        case 'food': return 'Utensils';
        case 'shopping': return 'ShoppingBag';
        case 'transport': return 'Car';
        case 'home': return 'Home';
        case 'utilities': return 'Zap';
        case 'salary': return 'DollarSign';
        case 'freelance': return 'Coffee';
        case 'investment': return 'Tag';
        default: return 'DollarSign';
    }
};
