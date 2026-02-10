import { View } from "react-native";
import Svg, { Polygon, Line, Text as SvgText, Circle } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";

export interface RadarDimension {
  label: string;
  value: number; // 0-10
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
}

/**
 * 六边形雷达图组件
 * 用于可视化感恩日记的六个维度分析
 */
export function RadarChart({ dimensions, size = 280 }: RadarChartProps) {
  const colors = useColors();
  
  if (dimensions.length !== 6) {
    throw new Error("RadarChart requires exactly 6 dimensions");
  }

  const center = size / 2;
  const radius = size / 2 - 60; // 留出空间给标签
  const maxValue = 10;
  const levels = 5; // 5个层级(2, 4, 6, 8, 10)

  // 计算六边形顶点坐标
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2; // 从顶部开始,顺时针
    const r = (radius * value) / maxValue;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 生成背景网格的六边形
  const getGridPolygon = (level: number) => {
    const points = Array.from({ length: 6 }, (_, i) => {
      const point = getPoint(i, level * 2); // 每层间隔2分
      return `${point.x},${point.y}`;
    }).join(" ");
    return points;
  };

  // 生成数据多边形
  const dataPoints = dimensions.map((dim, i) => {
    const point = getPoint(i, dim.value);
    return `${point.x},${point.y}`;
  }).join(" ");

  // 标签位置(在六边形外侧)
  const getLabelPosition = (index: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const labelRadius = radius + 35;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        {/* 背景网格 */}
        {Array.from({ length: levels }, (_, i) => (
          <Polygon
            key={`grid-${i}`}
            points={getGridPolygon(i + 1)}
            fill="none"
            stroke={colors.border}
            strokeWidth="1"
            opacity={0.3}
          />
        ))}

        {/* 从中心到顶点的线 */}
        {Array.from({ length: 6 }, (_, i) => {
          const point = getPoint(i, maxValue);
          return (
            <Line
              key={`line-${i}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke={colors.border}
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        {/* 数据多边形 */}
        <Polygon
          points={dataPoints}
          fill={colors.primary}
          fillOpacity={0.2}
          stroke={colors.primary}
          strokeWidth="2"
        />

        {/* 数据点 */}
        {dimensions.map((dim, i) => {
          const point = getPoint(i, dim.value);
          return (
            <Circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={colors.primary}
            />
          );
        })}

        {/* 标签 */}
        {dimensions.map((dim, i) => {
          const pos = getLabelPosition(i);
          return (
            <SvgText
              key={`label-${i}`}
              x={pos.x}
              y={pos.y}
              fill={colors.foreground}
              fontSize="12"
              fontWeight="500"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {dim.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
