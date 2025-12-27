import { Transaction } from '../lib/types';

/**
 * AI Insights Engine
 * Provides intelligent analysis of spending patterns, trends, and recommendations
 */

export interface Insight {
    id: string;
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    message: string;
    priority: number; // Higher = more important (1-10)
    icon: 'trophy' | 'alert' | 'trending' | 'lightbulb' | 'calendar' | 'target' | 'money' | 'chart';
}

export interface AnalysisResult {
    insights: Insight[];
    healthScore: number; // 0-100
    savingsRate: number; // Percentage
    topCategory: string | null;
    unusualSpending: boolean;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
}

interface CategoryStats {
    name: string;
    total: number;
    count: number;
    average: number;
    percentage: number;
}

interface MonthlyStats {
    month: number;
    year: number;
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
}

/**
 * Generate intelligent insights from transaction data
 */
export function generateInsights(
    currentMonthTransactions: Transaction[],
    allTransactions: Transaction[],
    currentMonth: number,
    currentYear: number,
    monthlyTotals: { income: number; expense: number; balance: number }
): AnalysisResult {
    const insights: Insight[] = [];

    // Calculate category statistics for current month
    const categoryStats = calculateCategoryStats(currentMonthTransactions);

    // Calculate monthly statistics for trend analysis (last 6 months)
    const monthlyStats = calculateMonthlyStats(allTransactions, currentMonth, currentYear);

    // Get previous month stats for comparison
    const previousMonthStats = monthlyStats.length > 1 ? monthlyStats[1] : null;

    // Calculate health score
    const healthScore = calculateHealthScore(monthlyTotals, categoryStats, monthlyStats);

    // Calculate savings rate
    const savingsRate = monthlyTotals.income > 0
        ? ((monthlyTotals.income - monthlyTotals.expense) / monthlyTotals.income) * 100
        : 0;

    // Determine spending trend
    const spendingTrend = analyzeSpendingTrend(monthlyStats);

    // Check for unusual spending
    const unusualSpending = detectUnusualSpending(categoryStats, allTransactions, currentMonth, currentYear);

    // Generate insights based on analysis

    // 1. Savings Rate Insight
    if (monthlyTotals.income > 0) {
        if (savingsRate >= 30) {
            insights.push({
                id: 'excellent-savings',
                type: 'success',
                title: 'Excellent Saver!',
                message: `You're saving ${savingsRate.toFixed(0)}% of your income this month. That's above the recommended 20% rule. Keep it up!`,
                priority: 9,
                icon: 'trophy'
            });
        } else if (savingsRate >= 20) {
            insights.push({
                id: 'good-savings',
                type: 'success',
                title: 'On Track!',
                message: `You're saving ${savingsRate.toFixed(0)}% of your income. You're meeting the recommended savings goal!`,
                priority: 7,
                icon: 'target'
            });
        } else if (savingsRate >= 10) {
            insights.push({
                id: 'moderate-savings',
                type: 'info',
                title: 'Room for Improvement',
                message: `Your savings rate is ${savingsRate.toFixed(0)}%. Try to aim for at least 20% to build a healthy emergency fund.`,
                priority: 6,
                icon: 'trending'
            });
        } else if (savingsRate > 0) {
            insights.push({
                id: 'low-savings',
                type: 'warning',
                title: 'Low Savings Alert',
                message: `You're only saving ${savingsRate.toFixed(0)}% this month. Consider reviewing non-essential expenses.`,
                priority: 8,
                icon: 'alert'
            });
        } else {
            insights.push({
                id: 'no-savings',
                type: 'warning',
                title: 'Overspending Alert',
                message: `Your expenses exceed your income by ${Math.abs(savingsRate).toFixed(0)}%. This is unsustainable long-term.`,
                priority: 10,
                icon: 'alert'
            });
        }
    }

    // 2. Category Analysis
    if (categoryStats.length > 0) {
        const topCategory = categoryStats[0];

        // Check if one category dominates spending (> 50%)
        if (topCategory.percentage > 50) {
            insights.push({
                id: 'category-dominance',
                type: 'info',
                title: 'Spending Concentration',
                message: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(0)}% of your spending. Consider if this aligns with your priorities.`,
                priority: 6,
                icon: 'chart'
            });
        }

        // Identify discretionary vs essential spending
        const discretionary = ['entertainment', 'shopping', 'dining', 'food', 'gifts', 'travel', 'subscriptions'];
        const discretionarySpending = categoryStats
            .filter(c => discretionary.some(d => c.name.toLowerCase().includes(d)))
            .reduce((sum, c) => sum + c.total, 0);

        const discretionaryPercent = monthlyTotals.expense > 0
            ? (discretionarySpending / monthlyTotals.expense) * 100
            : 0;

        if (discretionaryPercent > 40) {
            insights.push({
                id: 'high-discretionary',
                type: 'tip',
                title: 'Discretionary Spending',
                message: `${discretionaryPercent.toFixed(0)}% of your spending is on discretionary items. Small cuts here can boost savings significantly.`,
                priority: 5,
                icon: 'lightbulb'
            });
        }
    }

    // 3. Month-over-Month Comparison
    if (previousMonthStats) {
        const expenseChange = previousMonthStats.expense > 0
            ? ((monthlyTotals.expense - previousMonthStats.expense) / previousMonthStats.expense) * 100
            : 0;

        if (expenseChange > 20) {
            insights.push({
                id: 'expense-spike',
                type: 'warning',
                title: 'Spending Spike',
                message: `Your expenses are up ${expenseChange.toFixed(0)}% compared to last month. Review recent transactions for unexpected costs.`,
                priority: 7,
                icon: 'trending'
            });
        } else if (expenseChange < -15) {
            insights.push({
                id: 'expense-reduction',
                type: 'success',
                title: 'Spending Decreased!',
                message: `Great job! Your expenses are down ${Math.abs(expenseChange).toFixed(0)}% compared to last month.`,
                priority: 6,
                icon: 'trophy'
            });
        }

        // Income comparison
        const incomeChange = previousMonthStats.income > 0
            ? ((monthlyTotals.income - previousMonthStats.income) / previousMonthStats.income) * 100
            : 0;

        if (incomeChange > 20) {
            insights.push({
                id: 'income-increase',
                type: 'success',
                title: 'Income Growth',
                message: `Your income increased by ${incomeChange.toFixed(0)}% this month. Consider saving the extra!`,
                priority: 5,
                icon: 'money'
            });
        } else if (incomeChange < -20 && monthlyTotals.income > 0) {
            insights.push({
                id: 'income-decrease',
                type: 'info',
                title: 'Lower Income',
                message: `Your income is ${Math.abs(incomeChange).toFixed(0)}% lower than last month. Adjust your budget accordingly.`,
                priority: 6,
                icon: 'alert'
            });
        }
    }

    // 4. Spending Pattern Insights
    if (currentMonthTransactions.length >= 5) {
        // Check for frequent small transactions (possible impulse spending)
        const smallTransactions = currentMonthTransactions.filter(
            t => t.type === 'expense' && t.amount < getAverageExpense(currentMonthTransactions) * 0.2
        );

        if (smallTransactions.length > 10) {
            insights.push({
                id: 'impulse-spending',
                type: 'tip',
                title: 'Many Small Purchases',
                message: `You have ${smallTransactions.length} small transactions this month. These can add up - consider the "latte factor" savings approach.`,
                priority: 4,
                icon: 'lightbulb'
            });
        }

        // Check for consistent spending days
        const weekdaySpending = analyzeWeekdaySpending(currentMonthTransactions);
        if (weekdaySpending.peak) {
            insights.push({
                id: 'weekday-pattern',
                type: 'info',
                title: 'Spending Pattern Detected',
                message: `You tend to spend most on ${weekdaySpending.peak}s. Being aware of this pattern can help you plan better.`,
                priority: 3,
                icon: 'calendar'
            });
        }
    }

    // 5. Trend-based Insights
    if (spendingTrend === 'increasing' && monthlyStats.length >= 3) {
        const averageIncrease = calculateAverageExpenseIncrease(monthlyStats);
        insights.push({
            id: 'spending-trend-up',
            type: 'warning',
            title: 'Upward Spending Trend',
            message: `Your expenses have been increasing by an average of ${averageIncrease.toFixed(0)}% monthly. Consider setting a budget limit.`,
            priority: 7,
            icon: 'trending'
        });
    } else if (spendingTrend === 'decreasing' && monthlyStats.length >= 3) {
        insights.push({
            id: 'spending-trend-down',
            type: 'success',
            title: 'Positive Trend',
            message: `Your spending has been consistently decreasing. Your financial discipline is paying off!`,
            priority: 5,
            icon: 'trophy'
        });
    }

    // 6. Custom Tips based on categories
    const tipCategory = categoryStats.find(c =>
        c.name.toLowerCase().includes('subscription') ||
        c.name.toLowerCase().includes('phone')
    );
    if (tipCategory && tipCategory.total > 0) {
        insights.push({
            id: 'subscription-tip',
            type: 'tip',
            title: 'Subscription Check',
            message: `You're spending on subscriptions/services. Review them quarterly - you might find ones you no longer use.`,
            priority: 3,
            icon: 'lightbulb'
        });
    }

    // Sort insights by priority (highest first)
    insights.sort((a, b) => b.priority - a.priority);

    // Limit to top 5 insights to avoid overwhelming the user
    const topInsights = insights.slice(0, 5);

    return {
        insights: topInsights,
        healthScore,
        savingsRate,
        topCategory: categoryStats[0]?.name || null,
        unusualSpending,
        spendingTrend
    };
}

/**
 * Calculate statistics for each expense category
 */
function calculateCategoryStats(transactions: Transaction[]): CategoryStats[] {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, { total: number; count: number }>();

    expenses.forEach(t => {
        const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
        categoryMap.set(t.category, {
            total: existing.total + t.amount,
            count: existing.count + 1
        });
    });

    return Array.from(categoryMap.entries())
        .map(([name, stats]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            total: stats.total,
            count: stats.count,
            average: stats.total / stats.count,
            percentage: totalExpense > 0 ? (stats.total / totalExpense) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Calculate monthly statistics for the last N months
 */
function calculateMonthlyStats(
    transactions: Transaction[],
    currentMonth: number,
    currentYear: number,
    monthsBack: number = 6
): MonthlyStats[] {
    const stats: MonthlyStats[] = [];

    for (let i = 0; i < monthsBack; i++) {
        let month = currentMonth - i;
        let year = currentYear;

        while (month < 0) {
            month += 12;
            year -= 1;
        }

        const monthTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === month && date.getFullYear() === year;
        });

        const income = monthTransactions
            .filter(t => t.type === 'income' || t.type === 'borrowed')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthTransactions
            .filter(t => t.type === 'expense' || t.type === 'lent')
            .reduce((sum, t) => sum + t.amount, 0);

        stats.push({
            month,
            year,
            income,
            expense,
            savings: income - expense,
            savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0
        });
    }

    return stats;
}

/**
 * Calculate a financial health score (0-100)
 */
function calculateHealthScore(
    totals: { income: number; expense: number; balance: number },
    categories: CategoryStats[],
    monthlyStats: MonthlyStats[]
): number {
    let score = 50; // Start at neutral

    // Factor 1: Savings rate (max +30 points)
    if (totals.income > 0) {
        const savingsRate = (totals.income - totals.expense) / totals.income;
        if (savingsRate >= 0.3) score += 30;
        else if (savingsRate >= 0.2) score += 25;
        else if (savingsRate >= 0.1) score += 15;
        else if (savingsRate >= 0) score += 5;
        else score -= 20; // Negative savings
    }

    // Factor 2: Spending diversity (max +10 points)
    if (categories.length >= 3) {
        const topCategoryPercent = categories[0]?.percentage || 0;
        if (topCategoryPercent < 40) score += 10;
        else if (topCategoryPercent < 60) score += 5;
    }

    // Factor 3: Consistency (max +10 points)
    if (monthlyStats.length >= 3) {
        const positiveSavingsMonths = monthlyStats.filter(m => m.savings > 0).length;
        const percentPositive = positiveSavingsMonths / monthlyStats.length;
        score += Math.round(percentPositive * 10);
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Analyze spending trend over time
 */
function analyzeSpendingTrend(monthlyStats: MonthlyStats[]): 'increasing' | 'decreasing' | 'stable' {
    if (monthlyStats.length < 3) return 'stable';

    let increases = 0;
    let decreases = 0;

    for (let i = 0; i < monthlyStats.length - 1; i++) {
        const current = monthlyStats[i].expense;
        const previous = monthlyStats[i + 1].expense;

        if (previous > 0) {
            const change = (current - previous) / previous;
            if (change > 0.05) increases++;
            else if (change < -0.05) decreases++;
        }
    }

    if (increases >= monthlyStats.length - 2) return 'increasing';
    if (decreases >= monthlyStats.length - 2) return 'decreasing';
    return 'stable';
}

/**
 * Detect unusual spending patterns
 */
function detectUnusualSpending(
    currentStats: CategoryStats[],
    allTransactions: Transaction[],
    currentMonth: number,
    currentYear: number
): boolean {
    // Compare current month category spending to 3-month average
    const previousMonths = calculateMonthlyStats(allTransactions, currentMonth - 1, currentYear, 3);

    if (previousMonths.length < 3) return false;

    const avgExpense = previousMonths.reduce((sum, m) => sum + m.expense, 0) / previousMonths.length;
    const currentExpense = currentStats.reduce((sum, c) => sum + c.total, 0);

    // Consider unusual if > 50% higher than average
    return currentExpense > avgExpense * 1.5;
}

/**
 * Get average expense amount
 */
function getAverageExpense(transactions: Transaction[]): number {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return 0;
    return expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length;
}

/**
 * Analyze which weekday has most spending
 */
function analyzeWeekdaySpending(transactions: Transaction[]): { peak: string | null } {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayTotals = new Array(7).fill(0);

    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const day = new Date(t.date).getDay();
            dayTotals[day] += t.amount;
        });

    const maxIndex = dayTotals.indexOf(Math.max(...dayTotals));
    const maxValue = dayTotals[maxIndex];
    const avgValue = dayTotals.reduce((a, b) => a + b, 0) / 7;

    // Only report if significantly higher than average
    if (maxValue > avgValue * 1.3) {
        return { peak: weekdays[maxIndex] };
    }

    return { peak: null };
}

/**
 * Calculate average monthly expense increase
 */
function calculateAverageExpenseIncrease(monthlyStats: MonthlyStats[]): number {
    if (monthlyStats.length < 2) return 0;

    let totalChange = 0;
    let changes = 0;

    for (let i = 0; i < monthlyStats.length - 1; i++) {
        const current = monthlyStats[i].expense;
        const previous = monthlyStats[i + 1].expense;

        if (previous > 0) {
            totalChange += ((current - previous) / previous) * 100;
            changes++;
        }
    }

    return changes > 0 ? totalChange / changes : 0;
}
