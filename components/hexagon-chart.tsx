import { View, Text } from "react-native";
import Svg, { Polygon, Line, Circle, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { useLanguage } from "@/hooks/use-language";

export interface HexagonData {
  love: number;      // 爱 (0-100)
  gratitude: number; // 感恩 (0-100)
  joy: number;       // 喜悦 (0-100)
  acceptance: number;// 接纳 (0-100)
  peace: number;     // 平和 (0-100)
  courage: number;   // 勇气 (0-100)
}

interface HexagonChartProps {
  data: HexagonData;
  size?: number;
}

const LABELS_ZH = [
  { key: 'love', label: '爱', emoji: '💗' },
  { key: 'gratitude', label: '感恩', emoji: '🙏' },
  { key: 'joy', label: '喜悦', emoji: '✨' },
  { key: 'peace', label: '平和', emoji: '☮️' },
  { key: 'courage', label: '勇气', emoji: '💪' },
  { key: 'acceptance', label: '接纳', emoji: '🤗' },
];

const LABELS_EN = [
  { key: 'love', label: 'Love', emoji: '💗' },
  { key: 'gratitude', label: 'Gratitude', emoji: '🙏' },
  { key: 'joy', label: 'Joy', emoji: '✨' },
  { key: 'peace', label: 'Peace', emoji: '☮️' },
  { key: 'courage', label: 'Courage', emoji: '💪' },
  { key: 'acceptance', label: 'Accept', emoji: '🤗' },
];

export function HexagonChart({ data, size = 280 }: HexagonChartProps) {
  const colors = useColors();
  const { language } = useLanguage();
  const LABELS = language === 'en' ? LABELS_EN : LABELS_ZH;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.48;

  // Calculate points for hexagon
  const getPoint = (index: number, value: number = 100) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = (radius * value) / 100;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  // Get label position
  const getLabelPoint = (index: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle),
    };
  };

  // Background hexagon points (100%)
  const bgPoints = LABELS.map((_, i) => getPoint(i, 100));
  const bgPointsStr = bgPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Middle hexagon points (50%)
  const midPoints = LABELS.map((_, i) => getPoint(i, 50));
  const midPointsStr = midPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Data hexagon points
  const dataValues = [
    data.love,
    data.gratitude,
    data.joy,
    data.peace,
    data.courage,
    data.acceptance,
  ];
  const dataPoints = dataValues.map((v, i) => getPoint(i, v));
  const dataPointsStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Calculate average
  const average = Math.round(dataValues.reduce((a, b) => a + b, 0) / 6);

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Background hexagon */}
        <Polygon
          points={bgPointsStr}
          fill="transparent"
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Middle hexagon (50%) */}
        <Polygon
          points={midPointsStr}
          fill="transparent"
          stroke={colors.border}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const point = getPoint(i, 100);
          return (
            <Line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke={colors.border}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data hexagon */}
        <Polygon
          points={dataPointsStr}
          fill={`${colors.primary}30`}
          stroke={colors.primary}
          strokeWidth={2}
        />

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={colors.primary}
          />
        ))}

        {/* Center circle */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill={colors.muted}
        />
      </Svg>

      {/* Labels around the chart */}
      <View 
        style={{ 
          position: 'absolute', 
          width: size, 
          height: size,
        }}
      >
        {LABELS.map((item, i) => {
          const pos = getLabelPoint(i);
          const value = dataValues[i];
          return (
            <View
              key={item.key}
              style={{
                position: 'absolute',
                left: pos.x - 30,
                top: pos.y - 20,
                width: 60,
                alignItems: 'center',
              }}
            >
              <Text className="text-lg">{item.emoji}</Text>
              <Text className="text-xs text-foreground font-medium">{item.label}</Text>
              <Text className="text-xs text-primary font-bold">{value}%</Text>
            </View>
          );
        })}
      </View>

      {/* Average score */}
      <View className="mt-4 items-center">
        <Text className="text-sm text-muted">{language === 'en' ? 'Overall Energy Level' : '整体能量水平'}</Text>
        <Text className="text-3xl font-bold text-primary">{average}%</Text>
      </View>
    </View>
  );
}
