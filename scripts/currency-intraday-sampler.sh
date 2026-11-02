#!/bin/bash
# Amostra o spot FX (Dólar, Yuan) no buffer intraday Redis — history.php 1D FX faz o append a cada chamada.
# Rodar via cron a cada 3 min: assim o gráfico 1D do FX preenche mesmo sem ninguém com o painel aberto
# (BTC 1D já é intraday real da CoinGecko; endpoints de cotação são públicos, sem auth). @created 2026-07-08
BASE="https://dshowdash.com.br/api/currencies/history.php"
for a in usd-brl usd-cny; do
  curl -s --max-time 12 --resolve dshowdash.com.br:443:127.0.0.1 "$BASE?asset=$a&range=1D" -o /dev/null 2>/dev/null
done
