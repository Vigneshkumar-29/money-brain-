import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
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
 * Single Bar Component - Renders immediately and animates
 */
const Bar = memo(({
    heightPercent,
    width,
    color,
    isSelected,
    isIncome,
    animationDelay
}: {
    heightPercent: number;
    width: number;
    color: string;
    isSelected: boolean;
    isIncome: boolean;
    animationDelay: number;
}) => {
    const heightAnim = useRef(new Animated.Value(heightPercent)).current;

    useEffect(() => {
        // Animate to target height
        Animated.timing(heightAnim, {
            toValue: heightPercent,
            duration: 300,
            delay: animationDelay,
            useNativeDriver: false,
        }).start();
    }, [heightPercent, animationDelay]);

    return (
        <Animated.View
            style={{
                width: width,
                height: heightAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                }),
                backgroundColor: color,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                transform: [{ scale: isSelected ? 1.08 : 1 }],
                minHeight: 4,
                ...(isIncome && {
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isSelected ? 0.8 : 0.4,
                    shadowRadius: isSelected ? 12 : 6,
                    elevation: isSelected ? 6 : 3,
                }),
            }}
        />
    );
});

/**
 * Interactive Bar Chart - Renders immediately on mount
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

    // Calculate max value for scaling
    const maxValue = useMemo(() =>
        Math.max(...data.map(d => Math.max(d.income, d.expense)), 1),
        [data]
    );

    // Calculate bar width
    const barWidth = useMemo(() =>
        Math.min((chartWidth / Math.max(data.length, 1)) - 16, 40),
        [chartWidth, data.length]
    );

    // Pre-calculate all bar heights as percentages
    const barHeights = useMemo(() => data.map(week => ({
        expensePercent: week.expense > 0 ? Math.max((week.expense / maxValue) * 100, 5) : 5,
        incomePercent: week.income > 0 ? Math.max((week.income / maxValue) * 100, 5) : 5,
    })), [data, maxValue]);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        setChartWidth(event.nativeEvent.layout.width);
    }, []);

    if (data.length === 0) {
        return (
            <View style={[styles.chartArea, { height, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.emptyText}>No data available</Text>
            </View>
        );
    }

    return (
        <View onLayout={handleLayout}>
            {/* Tooltip for selected bar */}
            {selectedIndex !== null && data[selectedIndex] && (
                <View style={styles.tooltipContainer}>
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

            {/* Chart Area - Renders immediately */}
            <View style={[styles.chartArea, { height }]}>
                {data.map((week, index) => {
                    const isSelected = selectedIndex === index;
                    const heights = barHeights[index];

                    return (
                        <Pressable
                            key={`bar-${index}`}
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
                                <Bar
                                    width={barWidth / 2 - 1}
                                    heightPercent={heights.expensePercent}
                                    color={expenseColor}
                                    isSelected={isSelected}
                                    isIncome={false}
                                    animationDelay={index * 50}
                                />
                                {/* Income Bar */}
                                <Bar
                                    width={barWidth / 2 - 1}
                                    heightPercent={heights.incomePercent}
                                    color={incomeColor}
                                    isSelected={isSelected}
                                    isIncome={true}
                                    animationDelay={index * 50}
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
 * Progress Bar Component - Renders immediately
 */
const ProgressBar = memo(({
    percentage,
    color,
    delay
}: {
    percentage: number;
    color: string;
    delay: number;
}) => {
    const widthAnim = useRef(new Animated.Value(percentage)).current;

    useEffect(() => {
        Animated.timing(widthAnim, {
            toValue: percentage,
            duration: 400,
            delay: delay,
            useNativeDriver: false,
        }).start();
    }, [percentage, delay]);

    return (
        <View style={styles.progressBarBg}>
            <Animated.View
                style={{
                    height: '100%',
                    width: widthAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                    }),
                    backgroundColor: color,
                    borderRadius: 5,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                    minWidth: 4,
                }}
            />
        </View>
    );
});

/**
 * Interactive Category Chart - Renders immediately on mount
 */
export function InteractiveCategoryChart({
    data,
    formatCurrency,
    totalExpense
}: InteractiveCategoryChartProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
                        key={`category-${index}`}
                        onPressIn={() => setSelectedIndex(index)}
                        onPressOut={() => setSelectedIndex(null)}
                    >
                        <View
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

                            {/* Progress Bar - Renders immediately */}
                            <ProgressBar
                                percentage={item.percentage}
                                color={item.color}
                                delay={index * 60}
                            />

                            {/* Expanded Details on Selection */}
                            {isSelected && totalExpense > 0 && (
                                <View style={styles.expandedDetails}>
                                    <Text style={styles.detailText}>
                                        {((item.value / totalExpense) * 100).toFixed(1)}% of total
                                    </Text>
                                    <Text style={styles.detailText}>
                                        ~{formatCurrency(item.value / 30)}/day
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Pressable>
                );
            })}

            {/* Summary Bar */}
            <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Spending Distribution</Text>
                <View style={styles.summaryBar}>
                    {data.map((item, index) => (
                        <View
                            key={`summary-${index}`}
                            style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.color,
                                height: '100%',
                                minWidth: 2,
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
        gap: 3,
        alignItems: 'flex-end',
    },
    barLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Category Chart Styles
    categoryContainer: {
        gap: 12,
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
        height: 10,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 5,
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
