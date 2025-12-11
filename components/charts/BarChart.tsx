import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
}

export default function BarChart({ data, height = 220, barColor = '#2ECC71' }: BarChartProps) {
  const screenWidth = Dimensions.get('window').width - 72; // padding
  const maxVal = Math.max(...data.map(d => d.value));
  const barWidth = (screenWidth / data.length) * 0.65;
  const spacing = (screenWidth / data.length) * 0.35;

  return (
    <View>
      <Svg height={height} width={screenWidth}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxVal) * (height - 30);
          const x = index * (barWidth + spacing);
          const y = height - barHeight - 20;

          return (
            <React.Fragment key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx={8}
              />
              <SvgText
                x={x + barWidth / 2}
                y={height - 5}
                fontSize="13"
                fill="#6B7280"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="Manrope-SemiBold"
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
