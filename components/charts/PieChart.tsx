import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface PieChartData {
    label: string;
    value: number;
    color: string;
}

interface PieChartProps {
    data: PieChartData[];
    size?: number;
}

export default function PieChart({ data, size = 200 }: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    let currentAngle = -90; // Start from top

    const slices = data.map((item) => {
        const percentage = (item.value / total) * 100;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        currentAngle = endAngle;

        // Calculate path for pie slice
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = centerX + radius * Math.cos(startRad);
        const y1 = centerY + radius * Math.sin(startRad);
        const x2 = centerX + radius * Math.cos(endRad);
        const y2 = centerY + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        return {
            ...item,
            path,
            percentage: percentage.toFixed(1),
        };
    });

    return (
        <View style={{ alignItems: 'center' }}>
            <Svg width={size} height={size}>
                {slices.map((slice, index) => (
                    <G key={index}>
                        <Circle
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={radius}
                            strokeDasharray={`${(parseFloat(slice.percentage) / 100) * (2 * Math.PI * radius)} ${2 * Math.PI * radius}`}
                            strokeDashoffset={-slices.slice(0, index).reduce((sum, s) => sum + (parseFloat(s.percentage) / 100) * (2 * Math.PI * radius), 0)}
                            rotation="-90"
                            origin={`${centerX}, ${centerY}`}
                        />
                    </G>
                ))}
                {/* Center circle for donut effect */}
                <Circle
                    cx={centerX}
                    cy={centerY}
                    r={radius * 0.6}
                    fill="#FAFAF8"
                />
            </Svg>
        </View>
    );
}
