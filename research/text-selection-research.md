# React Native 文字选择高亮功能研究

## 方案1: @rob117/react-native-selectable-text

**来源:** https://www.npmjs.com/package/@rob117/react-native-selectable-text

### 功能特点
- 跨平台支持 (iOS & Android)
- 支持嵌套文字样式
- 自定义菜单选项和回调处理
- 支持React Native 0.81.1+
- 支持新架构 (Fabric)

### 使用方式
```jsx
import { SelectableTextView } from '@rob117/react-native-selectable-text';

const handleSelection = (event) => {
  const { chosenOption, highlightedText } = event;
  // chosenOption: 用户选择的菜单选项
  // highlightedText: 用户高亮选中的文字
};

<SelectableTextView
  menuOptions={['收藏', '复制', '分享']}
  onSelection={handleSelection}
>
  <Text>这是可选择的文字内容</Text>
</SelectableTextView>
```

### 关键API
- `menuOptions`: 菜单选项数组
- `onSelection`: 选择回调，返回 { chosenOption, highlightedText }

### 限制
- 需要运行 `pod install` (iOS)
- 要求 React Native 0.81.1+
- 要求启用新架构 (Fabric)
- **可能不兼容 Expo managed workflow**

---

## 方案2: rn-text-touch-highlight

**来源:** https://github.com/benjamineruvieru/rn-text-touch-highlight

### 功能特点
- 用户可以通过点击和拖拽来高亮文字
- 支持自定义高亮颜色和文字颜色
- 支持初始高亮数据（可以预设高亮区域）
- 支持获取高亮数据和删除高亮
- 支持点击高亮区域的回调

### 依赖
- react-native-reanimated
- react-native-gesture-handler

### 使用方式
```jsx
import { HighlightText } from 'rn-text-touch-highlight';

<HighlightText
  ref={highlightRef}
  text={'这是可以高亮的文字内容'}
  textColor={'black'}
  highlightedTextColor={'white'}
  highlightColor={'blue'}
  onHighlightEnd={(id) => {
    console.log('高亮结束', id);
  }}
  onHighlightTapped={(id, event) => {
    console.log('点击高亮', id, event);
  }}
/>

// 获取高亮数据
const data = highlightRef.current?.getHighlightedData();
// 返回: [{ start: 20, end: 44 }, ...]
```

### 关键API
- `text`: 要显示的文字内容
- `onHighlightEnd`: 高亮结束回调
- `onHighlightTapped`: 点击高亮区域回调
- `getHighlightedData()`: 获取高亮数据（start, end位置）

### 优点
- 纯 JavaScript 实现，不需要原生代码
- 依赖的库（reanimated, gesture-handler）已经在项目中安装
- **可能兼容 Expo managed workflow**

### 限制
- 只能获取高亮的位置（start, end），需要自己提取文字
- 不支持嵌套文字样式
- 用户体验是“拖拽高亮”而不是“选择文字”

---

## 方案3: React Native原生Text组件 selectable属性

**来源:** https://reactnative.dev/docs/text

### 功能特点
- 内置属性，无需额外安装
- 允许用户选择文字，使用原生复制粘贴功能

### 使用方式
```jsx
<Text selectable={true}>
  这是可以选择的文字
</Text>
```

### 限制
- **无法获取选中的文字内容** - 这是最大的问题！
- 只能使用系统默认的复制/粘贴菜单
- 无法自定义菜单选项（如“收藏”）
- 无法获取选择范围（start, end）

### 结论
**不适合我们的需求** - 因为无法获取用户选中的文字内容

---

## 方案4: WebView方案

使用WebView渲染文字，通过JavaScript获取选中的文字。

### 优点
- 完全控制文字选择行为
- 可以自定义菜单
- 可以获取选中的文字

### 缺点
- 性能较差（WebView开销大）
- 样式难以与原生组件保持一致
- 复杂度高

### 结论
**不推荐** - 开销太大，体验不佳

---

## 综合对比

| 方案 | Expo兼容 | 获取选中文字 | 自定义菜单 | 复杂度 | 推荐度 |
|------|----------|--------------|------------|--------|--------|
| @rob117/react-native-selectable-text | ❓ 可能不兼容 | ✅ | ✅ | 中 | ⭐⭐⭐ |
| rn-text-touch-highlight | ✅ 可能兼容 | ✅ | ✅ | 中 | ⭐⭐⭐⭐ |
| 原生 selectable | ✅ 完全兼容 | ❌ | ❌ | 低 | ⭐ |
| WebView | ✅ 完全兼容 | ✅ | ✅ | 高 | ⭐⭐ |

---

## 推荐方案

**首选: rn-text-touch-highlight**

理由:
1. 纯 JavaScript 实现，可能兼容 Expo managed workflow
2. 依赖的库（reanimated, gesture-handler）已经在项目中安装
3. 支持获取高亮数据和点击回调
4. 用户体验是“拖拽高亮”，符合移动端交互习惯

**备选: @rob117/react-native-selectable-text**

如果 rn-text-touch-highlight 不兼容 Expo，可以尝试这个库。

---

## 实现计划

### 第一阶段: 基础功能
1. 安装 rn-text-touch-highlight
2. 创建 HighlightableText 组件
3. 实现高亮收藏存储 (AsyncStorage)
4. 在智者总结和每日总结中使用

### 第二阶段: 收藏展示
1. 创建收藏页面/组件
2. 显示所有收藏的句子
3. 支持删除收藏

### 第三阶段: 优化体验
1. 添加触觉反馈
2. 添加动画效果
3. 支持分享收藏
