# AS5 — Fase 3: Character Creator 2D (checklist P2 + plano)

**Fontes lidas:** P10 §627–§628 (prioridades P0/P1/P2 + backlog do catálogo) · P2 índice completo (§51–§98) + seções normativas §68–§71 na íntegra. P3 (criação avançada) será lida antes do incremento C2.

## Mapa REQUISITO → estado (P2)

**JÁ COBERTO (4.6 + F2):** §54 cabeçalho · §55 tabs · §58 ordenação (menos popularidade→telemetria futura) · §59–§61 cards/estados/raridade (pips, NOVO, lock) · §62–§63 thumbs por categoria (FOCO_THUMB, SVG determinístico) · §66 hover card (Dica portal) · §79–§83 títulos/emblemas/fundos/molduras/banners · §84–§86 coleções/desbloqueio/vitrine · §87 favoritos server-side · §88 recentes · §91–§92 feedbacks/vazios · §93 responsividade · §94 persistência · §95 telemetria (parcial).

**GAPS priorizados:**
- [ ] C1a §64 HOVER PREVIEW NO PALCO: hover no card → store.visualizar (preview §608 JÁ EXISTE no núcleo — só ligar); sair → limparPreview.
- [ ] C1b §70 PAINEL "EQUIPADOS": lista slot→item com remover/trocar(abre categoria)/favoritar + §70.1 BLOQUEAR slot (Set em prefs; aleatório/presets/IA respeitam).
- [ ] C1c §69.1 UX DE CONFLITO: modal "Equipar X removerá Y" (Cancelar/Equipar e substituir) alimentado por avaliarRegras + troca implícita de slot exclusivo (hoje silenciosa).
- [ ] C1d §57 BUSCA INTELIGENTE: normalização de acentos/caixa + múltiplos termos (AND).
- [ ] C2 §68 SLOTS MÚLTIPLOS 2D: vocabulário §68.1 unificado com SLOTS_EQUIPAMENTO da F1; navegação por slot (chips §68.3) + resumo no topo (§68.2); crescimento além dos 3 slots atuais exige ARTE nova por slot (entra no plano de conteúdo da F9/P11).
- [ ] C2 §71 PERSONALIZAÇÃO POR ASSET: framework de propriedades (properties_schema_json §614 já modelado) — sliders por asset; primeiras entregas: aura (intensidade/velocidade) e emblema (escala/posição) via parâmetros no metadata.
- [ ] C3 §72–§75 canais de cor por camada de roupa + paletas + materiais 2D (expansão do engine usaCores → canais nomeados).
- [ ] P1' §56 filtros combinados em popover · §65 comparação no shell · §67 drawer completo de detalhes · §89 recomendações contextuais · §90 aleatório respeitando bloqueios.

## Ordem de execução

C1 (a–d: gaps com infra pronta, alto valor) → LER P3 → C2 (slots+propriedades) → C3 (canais de roupa) → P1' conforme couber antes da F4. Skeletons (R10 pendente) entram quando o catálogo assíncrono via registry ligar (flag as5.registry_api).
