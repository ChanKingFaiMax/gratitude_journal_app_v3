#!/bin/bash

echo "=== QA测试：智者名称中性化更新 ==="
echo ""

# 检查不应该出现的旧名称
echo "1. 检查是否还有旧名称残留..."
OLD_NAMES_COUNT=$(grep -r "耶稣\|释迦牟尼" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$OLD_NAMES_COUNT" -gt 0 ]; then
    echo "❌ 发现旧名称残留:"
    grep -r "耶稣\|释迦牟尼" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules"
else
    echo "✅ 无旧名称残留"
fi
echo ""

# 检查新名称是否正确使用
echo "2. 检查新名称使用情况..."
NEW_NAMES_ZH=$(grep -r "爱之使者\|觉者" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l)
NEW_NAMES_EN=$(grep -r "Messenger of Love\|The Awakened One" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l)
echo "✅ 中文新名称使用: $NEW_NAMES_ZH 处"
echo "✅ 英文新名称使用: $NEW_NAMES_EN 处"
echo ""

# 检查图标更新
echo "3. 检查图标更新..."
LOTUS_ICON=$(grep -r "🪷" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l)
SPARKLE_ICON=$(grep -r "✨" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | wc -l)
echo "✅ 莲花图标🪷使用: $LOTUS_ICON 处"
echo "✅ 星光图标✨使用: $SPARKLE_ICON 处"
echo ""

# 检查关键文件
echo "4. 检查关键文件更新状态..."
FILES=(
    "server/routers.ts"
    "app/masters-summary.tsx"
    "app/entry-detail.tsx"
    "app/write.tsx"
    "app/free-note.tsx"
    "app/review-result.tsx"
    "lib/i18n/zh.ts"
    "lib/i18n/en.ts"
    "lib/notification-quotes.ts"
)

for file in "${FILES[@]}"; do
    if grep -q "爱之使者\|觉者\|Messenger of Love\|The Awakened One" "$file" 2>/dev/null; then
        echo "✅ $file"
    else
        echo "❌ $file - 未找到新名称"
    fi
done

echo ""
echo "=== QA测试完成 ==="
