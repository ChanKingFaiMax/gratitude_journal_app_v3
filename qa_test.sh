#!/bin/bash

echo "=== 感恩日记应用 QA 测试 ==="
echo ""

# 1. TypeScript编译检查
echo "1. TypeScript类型检查..."
pnpm check 2>&1 | tail -20

echo ""
echo "2. 检查常见代码问题..."

# 检查未使用的变量
echo "- 检查TODO注释..."
grep -r "TODO\|FIXME\|XXX\|HACK" app/ lib/ server/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

echo ""
echo "- 检查console.log残留..."
grep -r "console\.log\|console\.error" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l

echo ""
echo "- 检查硬编码的URL..."
grep -r "http://\|https://" app/ lib/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules\|//" | head -10

echo ""
echo "3. 检查关键文件..."

# 检查必需文件
FILES=(
    "app.config.ts"
    "package.json"
    "app/(tabs)/index.tsx"
    "app/(tabs)/history.tsx"
    "app/(tabs)/settings.tsx"
    "app/write.tsx"
    "server/routers.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - 文件缺失"
    fi
done

echo ""
echo "4. 检查依赖问题..."
pnpm list --depth=0 2>&1 | grep -i "missing\|error" || echo "✅ 依赖完整"

echo ""
echo "=== QA测试完成 ==="
