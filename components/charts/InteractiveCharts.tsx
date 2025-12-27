import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Dimensions, LayoutChangeEvent, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BarData {
    label: string;
    income: number;
    expense: number;
}

interface InteractiveBarChartProps {
    data: BarData[];
    height?: number;
    formatCurrency: (amount: number) => string;
    incomeColor?: string;
    expenseColor?: string;
}

interface CategoryData {
    label: string;
    value: number;
    percentage: number;
    color: string;
}

interface InteractiveCategoryChartProps {
    data: CategoryData[];
    formatCurrency: (amount: number) => string;
    totalExpense: number;
}

/**
 * Interactive Bar Chart with touch feedback and animations
 */
export function InteractiveBarChart({
    data,
    height = 160,
    formatCurrency,
    incomeColor = '#36e27b',
    expenseColor = 'rgba(255,255,255,0.2)'
}: InteractiveBarChartProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [chartWidth, setChartWidth] = useState(SCREEN_WIDTH - 80);
    const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;

    // Calculate max value for scaling
    const maxValue = Math.max(
        ...data.map(d => Math.max(d.income, d.expense)),
        1
    );

    // Animate bars on mount and data change
    useEffect(() => {
        // Reset and animate
        animatedValues.forEach((av, index) => {
            av.setValue(0);
            Animated.spring(av, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: false,
                delay: index * 100,
            }).start();
        });
    }, [data]);

    const handleLayout = (event: LayoutChangeEvent) => {
        setChartWidth(event.nativeEvent.layout.width);
    };

    const barWidth = Math.min((chartWidth / data.length) - 16, 40);

    return (
        <View onLayout={handleLayout}>
            {/* Tooltip for selected bar */}
            {selectedIndex !== null && data[selectedIndex] && (
                <View style={[styles.tooltipContainer]}>
                    <View style={styles.tooltip}>
                        <Text style={styles.tooltipTitle}>
                            {data[selectedIndex].label}
                        </Text>
                        <View style={styles.tooltipRow}>
                            <View style={styles.tooltipDotContainer}>
                                <View style={[styles.tooltipDot, { backgroundColor: incomeColor }]} />
                                <Text style={[styles.tooltipValue, { color: '#4ade80' }]}>
                                    {formatCurrency(data[selectedIndex].income)}
                                </Text>
                            </View>
                            <View style={styles.tooltipDotContainer}>
                                <View style={[styles.tooltipDot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                                <Text style={[styles.tooltipValue, { color: '#d1d5db' }]}>
                                    {formatCurrency(data[selectedIndex].expense)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {/* Chart Area */}
            <View style={[styles.chartArea, { height }]}>
                {data.map((week, index) => {
                    const hasData = week.income > 0 || week.expense > 0;
                    const expenseHeightPercent = hasData ? (week.expense / maxValue) * 100 : 5;
                    const incomeHeightPercent = hasData ? (week.income / maxValue) * 100 : 5;

                    const isSelected = selectedIndex === index;

                    return (
                        <Pressable
                            key={index}
                            onPressIn={() => setSelectedIndex(index)}
                            onPressOut={() => setSelectedIndex(null)}
                            style={styles.barContainer}
                        >
                            <View
                                style={[
                                    styles.barGroup,
                                    {
                                        height: height - 24,
                                        opacity: selectedIndex !== null && !isSelected ? 0.4 : 1,
                                    }
                                ]}
                            >
                                {/* Expense Bar */}
                                <Animated.View
                                    style={{
                                        width: barWidth / 2 - 1,
                                        height: animatedValues[index]?.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', `${Math.max(expenseHeightPercent, 5)}%`]
                                        }) || '5%',
                                        backgroundColor: expenseColor,
                                        borderTopLeftRadius: 4,
                                        borderTopRightRadius: 4,
                                        transform: isSelected ? [{ scale: 1.1 }] : [{ scale: 1 }],
                                    }}
                                />
                                {/* Income Bar */}
                                <Animated.View
                                    style={{
                                        width: barWidth / 2 - 1,
                                        height: animatedValues[index]?.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', `${Math.max(incomeHeightPercent, 5)}%`]
                                        }) || '5%',
                                        backgroundColor: incomeColor,
                                        borderTopLeftRadius: 4,
                                        borderTopRightRadius: 4,
                                        shadowColor: incomeColor,
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: isSelected ? 0.8 : 0.4,
                                        shadowRadius: isSelected ? 16 : 8,
                                        elevation: isSelected ? 8 : 4,
                                        transform: isSelected ? [{ scale: 1.1 }] : [{ scale: 1 }],
                                    }}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.barLabel,
                                    { color: isSelected ? '#36e27b' : '#6b7280' }
                                ]}
                            >
                                {week.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

/**
 * Interactive Category Chart with touch feedback and animations
 */
export function InteractiveCategoryChart({
    data,
    formatCurrency,
    totalExpense
}: InteractiveCategoryChartProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const animatedValues = useRef(data.map(() => new Animated.Value(0))).current;

    // Animate progress bars
    useEffect(() => {
        // Reset and animate
        data.forEach((item, index) => {
            if (animatedValues[index]) {
                animatedValues[index].setValue(0);
                Animated.timing(animatedValues[index], {
                    toValue: item.percentage,
                    duration: 800,
                    delay: index * 150,
                    useNativeDriver: false,
                }).start();
            }
        });
    }, [data]);

    if (data.length === 0) {
        return (
            <Text style={styles.emptyText}>
                No expenses yet
            </Text>
        );
    }

    return (
        <View style={styles.categoryContainer}>
            {data.map((item, index) => {
                const isSelected = selectedIndex === index;

                return (
                    <Pressable
                        key={index}
                        onPressIn={() => setSelectedIndex(index)}
                        onPressOut={() => setSelectedIndex(null)}
                        style={[
                            styles.categoryItem,
                            {
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
                                transform: [{ scale: isSelected ? 1.02 : 1 }],
                            }
                        ]}
                    >
                        {/* Category Header */}
                        <View style={styles.categoryHeader}>
                            <View style={styles.categoryLabelContainer}>
                                <View
                                    style={[
                                        styles.categoryDot,
                                        {
                                            backgroundColor: item.color,
                                            shadowColor: item.color,
                                            shadowOpacity: isSelected ? 0.8 : 0.6,
                                            shadowRadius: isSelected ? 12 : 8,
                                        }
                                    ]}
                                />
                                <Text style={[
                                    styles.categoryLabel,
                                    { color: isSelected ? '#ffffff' : '#e5e7eb' }
                                ]}>
                                    {item.label}
                                </Text>
                            </View>
                            <View style={styles.categoryValueContainer}>
                                <Text style={styles.categoryValue}>
                                    {formatCurrency(item.value)}
                                </Text>
                                <View
                                    style={[
                                        styles.percentageBadge,
                                        { backgroundColor: `${item.color}30` }
                                    ]}
                                >
                                    <Text style={[styles.percentageText, { color: item.color }]}>
                                        {item.percentage.toFixed(1)}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <Animated.View
                                style={{
                                    height: '100%',
                                    width: animatedValues[index]?.interpolate({
                                        inputRange: [0, 100],
                                        outputRange: ['0%', '100%']
                                    }) || '0%',
                                    backgroundColor: item.color,
                                    borderRadius: 6,
                                    shadowColor: item.color,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 4,
                                }}
                            />
                        </View>

                        {/* Expanded Details on Selection */}
                        {isSelected && (
                            <View style={styles.expandedDetails}>
                                <Text style={styles.detailText}>
                                    {((item.value / totalExpense) * 100).toFixed(1)}% of total spending
                                </Text>
                                <Text style={styles.detailText}>
                                    Avg: {formatCurrency(item.value / 30)}/day
                                </Text>
                            </View>
                        )}
                    </Pressable>
                );
            })}

            {/* Summary Bar showing all categories */}
            <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Spending Distribution</Text>
                <View style={styles.summaryBar}>
                    {data.map((item, index) => (
                        <View
                            key={index}
                            style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.color,
                                height: '100%',
                            }}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Bar Chart Styles
    tooltipContainer: {
        position: 'absolute',
        top: -8,
        left: 0,
        right: 0,
        zIndex: 20,
        alignItems: 'center',
    },
    tooltip: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    tooltipTitle: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    tooltipRow: {
        flexDirection: 'row',
        gap: 12,
    },
    tooltipDotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tooltipDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    tooltipValue: {
        fontSize: 11,
        fontFamily: 'monospace',
    },
    chartArea: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingHorizontal: 8,
    },
    barContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
        height: '100%',
    },
    barGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 2,
        alignItems: 'flex-end',
    },
    barLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Category Chart Styles
    categoryContainer: {
        gap: 16,
    },
    categoryItem: {
        gap: 8,
        padding: 12,
        borderRadius: 12,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        elevation: 5,
    },
    categoryLabel: {
        fontWeight: '500',
        fontSize: 14,
    },
    categoryValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryValue: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: 'monospace',
    },
    percentageBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    percentageText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 12,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    expandedDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    detailText: {
        color: '#9ca3af',
        fontSize: 12,
    },
    summarySection: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
    },
    summaryBar: {
        height: 16,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    emptyText: {
        color: '#6b7280',
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 16,
    },
});
