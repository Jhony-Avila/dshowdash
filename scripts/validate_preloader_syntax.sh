#!/bin/bash
# Script de Validação Sintática - Preloader v3.0.0
# Gerado automaticamente em: 2025-11-08 11:22:00

echo "============================================"
echo "🔍 VALIDAÇÃO SINTÁTICA - PRELOADER"
echo "============================================"
echo ""

ERRORS=0
TOTAL=0

validate_file() {
    local file=$1
    local name=$2
    TOTAL=$((TOTAL + 1))
    
    if [ ! -f "$file" ]; then
        echo "❌ $name - ARQUIVO NÃO ENCONTRADO"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    if node --check "$file" 2>/dev/null; then
        echo "✅ $name"
        return 0
    else
        echo "❌ $name - ERRO DE SINTAXE"
        node --check "$file"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo "📁 CORE FILES:"
validate_file "/var/www/dshowdash_new/public/modules/preloader/index.js" "index.js"
validate_file "/var/www/dshowdash_new/public/modules/preloader/core/state.js" "core/state.js"
validate_file "/var/www/dshowdash_new/public/modules/preloader/core/session.js" "core/session.js"
validate_file "/var/www/dshowdash_new/public/modules/preloader/core/progress.js" "core/progress.js"

echo ""
echo "🎨 UI FILES:"
validate_file "/var/www/dshowdash_new/public/modules/preloader/ui/animation.js" "ui/animation.js"
validate_file "/var/www/dshowdash_new/public/modules/preloader/ui/video.js" "ui/video.js"

echo ""
echo "🧹 UTILS:"
validate_file "/var/www/dshowdash_new/public/modules/preloader/utils/cleanup.js" "utils/cleanup.js"

echo ""
echo "📄 TEMPLATE:"
validate_file "/var/www/dshowdash_new/public/modules/preloader/template.js" "template.js"

echo ""
echo "🔗 EVENT SYSTEM:"
validate_file "/var/www/dshowdash_new/public/assets/js/events/event-bus.js" "events/event-bus.js"
validate_file "/var/www/dshowdash_new/public/assets/js/events/contracts.js" "events/contracts.js"

echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ TODOS OS ARQUIVOS VÁLIDOS ($TOTAL/$TOTAL)"
    echo "============================================"
    exit 0
else
    echo "❌ ERROS ENCONTRADOS: $ERRORS/$TOTAL"
    echo "============================================"
    exit 1
fi
