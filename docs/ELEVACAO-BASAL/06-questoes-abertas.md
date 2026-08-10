# Elevação Basal — 06 · Questões Abertas

> Dúvidas que precisam de resposta com evidência. Uma questão só sai daqui com
> resposta registrada no doc 05 (ou ADR correspondente) + fonte da evidência.

## Bloqueantes para M1 (contenção P0)

1. **Quais fontes exatas respondem por HTTP hoje?** (`.ts`, `.tsx`, `.patch`, `.md`, configs) — lista completa via coletor + verificação de consumidores antes de bloquear.
2. **O MySQL em `0.0.0.0:3306` está efetivamente exposto?** UFW/firewall externo bloqueia? Evidência: regras ativas + teste externo controlado.
3. **O `.patch` público tem algum consumidor legítimo?** Se não, trilha rápida de bloqueio.
4. **Qual backup de banco existe e quando foi o último restore comprovado?**
5. **Que alterações manuais não reconciliadas existem hoje no servidor?** (`git status` do worktree de produção)

## Bloqueantes para M2/M3 (baseline e governança)

6. **`public/api` é symlink físico? Para onde aponta?** (regra: alias não vira cópia física)
7. **Dos ~444 arquivos ignorados de `api/`: quais são fonte ativa × config × upload × cache × log × sessão × dado sensível × legado?**
8. **Quais dos 63 `dist` têm fonte conhecida e comando de build reproduzível?**
9. **Os 27 pares com TS mais recente que o JS: quais são, e o runtime carrega o JS defasado de quais?**
10. **`public/react/` participa do runtime atual?** (Parte 2 §63 pede tratamento específico)
11. **Qual é o papel real de `MIGRATION_STATUS.md` (180 KB na raiz)** — documentação viva ou histórico a arquivar?
12. **O vhost :8080 órfão serve a algum propósito (health check interno, tunnel)?** Ou é removível com teste de config?

## Bloqueantes para M4/M5 (toolchain e build)

13. **Node/npm do servidor × ambiente de build: quais versões exatas?** (reprodutibilidade)
14. **Quais builds internos (Vite 5) divergem do root (Vite 7) e por quê?**
15. **Existe hoje algum comando que gere TODOS os bundles do boot? Ou cada dist tem processo próprio/perdido?**

## Processo

- Responder questão = anexar evidência (saída de comando, hash, config) — nunca memória.
- Questão nova descoberta em qualquer lote entra aqui no mesmo lote.
- O coletor de evidências (scripts/basal/) responde total ou parcialmente: 1, 2, 5, 6, 12, 13.
