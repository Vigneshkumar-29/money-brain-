
export type Transaction = {
    id: string;
    amount: number;
    title: string;
    type: 'income' | 'expense' | 'lent' | 'borrowed';
    category: string;
    date: string;
    icon?: any; // We'll resolve this when using the data
};
