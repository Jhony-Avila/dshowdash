# ADR-004 · Estratégia TypeScript/JavaScript

**Status**: PENDENTE · **Prazo**: M4 (regra) / Parte 9 (execução completa)

## Contexto
5.540 pares TS/JS rastreados no mesmo caminho-base (verificado no clone): 5.461 com JS
mais recente, 27 com TS mais recente (risco de runtime defasado), 52 empatados. Regra
histórica do projeto: "TypeScript é fonte da verdade; nunca editar .js irmão à mão"
(compile via esbuild). Mas os pares versionados tornam ambígua a distinção fonte×gerado.

## Opções
1. **TS único como fonte; JS gerado sai do Git** (ignore específico + build gera).
   Vantagens: elimina ambiguidade estrutural. Riscos: runtime hoje carrega os JS versionados? — se sim, exige build confiável antes (Gate 2).
2. **TS fonte; JS gerado PERMANECE versionado com verificação de frescor no CI** (par sempre regenerado junto).
   Vantagens: runtime continua servível sem build no servidor; diff visível. Riscos: repo grande; exige check automático par-a-par para impedir defasagem.
3. **Congelar JS como runtime e migrar consumo para bundles** (JS adjacente some quando o bundle canônico assumir).
   Vantagens: alinha com M5/M6. Riscos: mais longo.

## Decisão provisória
Regra imediata (M0): TS = fonte candidata; JS = runtime potencial; proibido editar JS
gerado; os 27 pares TS-mais-novo têm verificação prioritária no M4; nenhum par novo
ambíguo pode nascer. Decisão estrutural (1×2×3, possivelmente por workspace) no M4 com
dados do M2.

## Evidência necessária
Lista dos 27 pares; identificação de JS manual × JS compilado; mapa de quais JS o
navegador carrega diretamente (vs via bundle).
