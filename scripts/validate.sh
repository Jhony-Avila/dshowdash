#!/bin/bash
echo "🔍 Validando estrutura..."
echo ""
echo "Core CSS:"
ls -lh /var/www/dshowdash_v3/public/core/css/
echo ""
echo "Core JS:"
ls -lh /var/www/dshowdash_v3/public/core/js/
echo ""
echo "Index:"
ls -lh /var/www/dshowdash_v3/public/index.html
echo ""
echo "Cards:"
ls -1d /var/www/dshowdash_v3/public/components/cards/card-* | wc -l
echo ""
echo "Panels:"
ls -1d /var/www/dshowdash_v3/public/components/panels/panel-* | wc -l
