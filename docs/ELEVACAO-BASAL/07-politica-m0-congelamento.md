# Elevação Basal — 07 · Política M0: Congelamento da Dívida Nova

> Em vigor desde 2026-08-10 (EB-003). Vale para TODOS os fluxos de trabalho no
> repositório e no servidor, incluindo o fluxo Avatar Studio, até a certificação (M15).

## 1. Proibições imediatas

Durante o programa é **proibido**:

1. editar qualquer arquivo em `dist/` manualmente;
2. criar novo código ativo ignorado pelo Git (todo código novo nasce rastreado);
3. adicionar novas fontes dentro de `public/` (congelamento — briefing §59; exceção: fluxos já governados existentes, ex. `public/koala/src`, até decisão do ADR-003);
4. criar árvores paralelas `v3`, `next`, `final` ou equivalentes;
5. criar novo global em `window`;
6. criar outro event bus;
7. adicionar dependência com versão divergente das existentes sem revisão registrada;
8. adicionar novo patch ao document root;
9. alterar produção manualmente sem registro de reconciliação (doc 05, tabela de emergências);
10. remover qualquer arquivo basal antes do inventário classificado (§26.1) — remoções sempre via `/backup` com timestamp, nunca delete;
11. mudança manual permanente em bundle (§26.2).

## 2. Processo de exceção

Uma exceção exige, ANTES da mudança: justificativa escrita no doc 05 + aprovação do
sponsor (Jhony) + plano de reconciliação com prazo. Emergência de produção segue o
protocolo do doc 01 §1 (princípio 2) e entra na tabela de emergências do doc 05.

## 3. Responsáveis e canal

| Papel | Responsável |
|---|---|
| Sponsor técnico / aprovador de exceções | Jhony |
| Execução dos lotes / evidências | Agente (Claude) |
| Canal de decisões | `docs/ELEVACAO-BASAL/05-log-de-decisoes.md` + ADRs |

## 4. Áreas congeladas (nenhuma edição fora do programa)

- `public/**/dist/` (artefatos);
- `public/app/` (runtime sombra — não editar, não copiar de/para `app/`);
- `public/bootstrap-v2/`, `public/core/`, `public/platform/`, `public/modules/`, `public/react/` (fundações não governadas — leitura apenas até M3);
- `.gitignore` (mudanças só por lote do programa com revisão);
- configs do Nginx (mudanças só via M1+ com `nginx -t` + rollback).

## 5. Quality gates básicos (a partir de agora)

Todo lote do programa entrega: typecheck verde onde aplicável · nenhum arquivo novo
ignorado ativo · nenhuma edição em área congelada fora do escopo do lote · formato de
entrega §34 completo (incl. rollback) · evidência antes/depois.

## 6. Critério de saída do M0

- [x] Regras documentadas (este doc);
- [ ] Equipe e agente alinhados (aceite do Jhony na Onda 1);
- [ ] Exceções (se houver) com aprovação registrada;
- [ ] Nenhuma nova duplicidade criada durante a transformação;
- [ ] Alterações basais passando por revisão (fluxo de lote + portão de diff).
