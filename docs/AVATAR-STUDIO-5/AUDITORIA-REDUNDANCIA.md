# Auditoria de distinctiveness — BRIEFING_COMPLEMENTAR_02 (§50–§79, §110)

> Gerada por `scripts/avatar/qa-visual/contact-sheet.mjs` (onda 1425). A ferramenta SUGERE candidatos (§72–§73 — assinatura de conteúdo 20×20 sobre thumb canonizado, sem fundo); **a classificação MERGE/VARIANT/REWORK/KEEP é humana** (§54, decisão do Jhony). Contact sheets em `scripts/avatar/testes/saida/contact-sheets/` (enviados ao Jhony).

## Como ler

- **VARIANT** (§56): difere só por cor/material/detalhe cosmético → vira variante de cor (sistema já existe, §59), não ocupa 2 cards.
- **MERGE** (§55): mesmo design → um só.
- **REWORK** (§57): deveriam ser diferentes, mas estão parecidos demais → diferenciar de verdade.
- **KEEP** (§58): silhueta/identidade já suficientemente distinta.

## Shortlist por categoria (top pares mais parecidos — sugestão)

### Olhos (48 itens · 31 pares ≥95%) — **P0 de revisão (§60)**
- `olh_padrao ↔ olh_heterocromia` 99% → **VARIANT** provável (heterocromia = cor diferente da íris).
- `olh_feliz ↔ olh_zen` 97%, `olh_cifrao ↔ olh_calculista` 97%, `olh_estrela ↔ olh_prisma` 98% → revisar.
- A família premium `olh_px_*` amendoada (fileiras finais da folha) é o caso mais forte do §60/§61 — o builder `parOlhos()` com amplitude pequena de `tilt/ry/irisR/palpebra` gera opções pouco distintas. Recomendação: manter o builder (§62), aumentar a amplitude visual OU consolidar 2–3 em variantes.

### Cabelo (60 itens · 301 pares ≥95%) — §64/§77
- `cab_curto ↔ cab_grisalho` 98% → **VARIANT** (exatamente o §65 — grisalho é cor, não estilo).
- `cab_chanel ↔ cab_babyliss` 99%, `cab_curto ↔ cab_pixie/ondas_curtas/lambido` 98% → cluster de cortes curtos quase idênticos; candidatos a MERGE/VARIANT.

### Roupa (40 itens · 213 pares ≥95%)
- `rou_camiseta ↔ rou_tricot` 99%, `rou_social ↔ rou_polo` 99% → silhueta igual (§24 — diferença só de gola/linha não basta).
- `rou_px_camiseta ↔ rou_px_polo`, `rou_px_hoodie ↔ rou_px_polo`, `rou_px_blazer ↔ rou_px_sobretudo` 99% → premium também tem clusters; candidatos a REWORK de silhueta (§24).

### Base/rosto (44 itens · 178 pares ≥95%)
- `bas_classica ↔ bas_sardas` 100% → **VARIANT** (só sardas). `bas_classica ↔ bas_veterano/sereno` 99% → detalhe.
- `bas_angular ↔ bas_marcada` 99% → revisar. (As bases PREMIUM `bas_px_*` foram reworkadas na onda 1424 e têm silhueta distinta — a redundância aqui é do LEGADO.)

### Fundo (26 itens · 49 pares ≥95%) — §66
- `fun_px_neon ↔ fun_hex/circuito/chuva` 98%, `fun_estrelas ↔ fun_circuito/chuva` 98% → fundos escuros com padrão fino leem parecido; a percepção do §66 confere. Revisar exposição (§78 — 12 memoráveis > 26 genéricos).

## Recomendação de processo (§76–§82)

1. Jhony revisa as 5 folhas + shortlists e marca cada candidato.
2. VARIANTs migram p/ o sistema de variantes (§59) — o ID legado continua renderizando saves (§80), mas sai da grade principal (`visibility: legacy`, §79).
3. REWORKs entram como ondas de arte (como a 1424 fez com rostos/cabelos).
4. Catálogo principal mostra os KEEP + Golden (§81/§83); "Mostrar todas/Legacy" em filtro avançado (§82).
5. Métrica que importa (§115): **nº de escolhas visualmente distintas**, não nº de assets.

## Limite da ferramenta (honesto)

A assinatura 20×20 tem ruído (muitos cabelos SÃO crescentes parecidos — o que é o próprio achado §77). Os números acima 95% são um PONTO DE PARTIDA para o olho humano, não um veredito. O contact sheet visual é a evidência primária (§53).
