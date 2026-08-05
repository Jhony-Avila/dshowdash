# Decisões numeradas — Avatar Studio (consolidado no repo)

> Registro completo nos docs do projeto Claude "Avatar Studio". Aqui, o
> resumo operacional das decisões EM VIGOR. Numeração contínua.

- **#45 (2026-07-30) — Regime de execução**: autonomia TOTAL com registro;
  suíte verde antes de cada entrega; ações irreversíveis/credenciais nunca
  autônomas (lista "precisa do Jhony"); sessão esgotou → estado nos docs;
  "prossiga" retoma.
- **#46 (2026-07-30) — Topologia do servidor**: produção vive em
  `feat/pipedrive-modulo-completo`; deploy = merge de origin/main nela;
  `public/index.html` é versionado NELA (na main não); blocos de servidor
  sempre com `&&` estrito.
- **#47 (2026-08-05) — Auto-deploy por webhook**: push no main → webhook
  HMAC (só enfileira) → runner root 1/min → deploy-as5.sh blindado.
  Secret a rotacionar ao sair de testes.
- **#48 (2026-08-05) — Migração para o projeto Claude dedicado** "Avatar
  Studio" (docs 01–09 lá).
- **#49 (2026-08-05) — Escopo do lote 221–230**: trilho canvas PRO
  (§323/§324, megas 221–223), título-componente + emblemas (§344/§345,
  224), templates assinatura (225), editor de showcase (§175/§175.1,
  226–227), timeline no shell (§220, 228), favoritos em categorias (§229,
  229), Minha Vitrine + galerias (§1076/§1077 recorte client-side, 230).
  Justificativa: A1 = maior densidade de valor sem bloqueio externo.
- **#50 (2026-08-05) — Flags do lote LIGADAS por padrão** (`as5.foto_canvas_pro`,
  `as5.showcase_editor`, `as5.timeline_shell`, `as5.favoritos_categorias`,
  `as5.vitrine_pessoal`), seguindo o padrão do rollout §650; rollback §651 =
  desligar a flag individual.
- **#51 (2026-08-05) — 3 regiões do Photo PRO por container query**: o grid
  ferramentas▏canvas▏propriedades (§323) engaja só com ≥700px de largura do
  contêiner `.avst-foto` (o aside clássico tem ~390px e o grid colapsaria —
  comprovado pelo teste onda-200); abaixo disso, fluxo empilhado com TODAS
  as ferramentas do canvas.
- **#52 (2026-08-05) — Teto do chunk `entry` 340→385KB** no gate de peso
  (crescimento intencional do lote 221–230: canvas PRO + editor showcase +
  timeline + vitrine, +40KB reais); margem ~10% preservada.

## Pendências do Jhony (herdadas — nunca autônomas)

Validação visual 201–210, 211–220 e 221–230 · Chave IA (Anexo B
RUNBOOK-BANCO) · zip UBC Standard · rotação GitHub PAT · rotação do secret
do webhook · renovar nexatechs.com.br · item B `#/panel-pipedrive/produtos` ·
decisão do trilho C (P11/P12/P14/P17/P18).
