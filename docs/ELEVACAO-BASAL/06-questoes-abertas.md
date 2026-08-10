# Elevação Basal — 06 · Questões Abertas

> Dúvidas que precisam de resposta com evidência. Uma questão só sai daqui com
> resposta registrada no doc 05 (ou ADR correspondente) + fonte da evidência.

## Bloqueantes para M1 (contenção P0) — ENCERRADO

1. ~~Quais fontes respondem por HTTP?~~ RESPONDIDA: `.ts/.tsx` servidos e importados em runtime (bootstrap-v2/core-runtime) → bloqueio adiado p/ M5/M6; `.patch` era resíduo, quarentenado.
2. ~~MySQL `0.0.0.0:3306` exposto?~~ RESPONDIDA: NÃO — DROP externo por firewall com allowlist (prova em EB-017). Bind mantido de propósito.
3. ~~`.patch` tem consumidor?~~ RESPONDIDA: não (resíduo); quarentenado + `deny .patch`.
4. **Qual backup de banco existe e quando foi o último restore comprovado?** — segue aberta (M9).
5. **Alterações manuais não reconciliadas no servidor?** — parcial: worktree de produção acompanha `feat/pipedrive-modulo-completo` (EB-009); reconciliar no M3.
17. ~~phpMyAdmin sem controle?~~ RESPONDIDA: fechado a `127.0.0.1`+`187.15.86.187` (EB-016).
19. ~~UFW/3306?~~ RESPONDIDA: UFW não instalado; firewall efetivo dropa 3306 externamente (EB-017).
20. ~~Quem consome MySQL remotamente?~~ Parcial: o próprio Jhony (IP allowlisted); lista de hosts do MySQL não lida (root exige senha) — não bloqueante, bind inalterado.

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

## Novas (Onda 2 — evidências do servidor de 2026-08-10)

16. **Modelo de branch de produção**: o servidor acompanha `feat/pipedrive-modulo-completo` (deploy faz merge de origin/main NELA). Consolidar para `main` como branch única de produção? (EB-009; candidata ao M3)
17. **`/phpmyadmin/` está publicado no vhost de produção** — qual controle de acesso existe (IP allowlist, auth_basic, Cloudflare Access)? Sem controle comprovado = P0 (BASAL-016).
18. ~~**Portas locais desconhecidas** `20241`/`37865`~~ — FECHADA (evidência M1 §A5): 20241 = cloudflared, 37865 = VS Code Server; ambas locais e benignas.
19. **UFW/firewall**: regras ativas que comprovem (ou não) o bloqueio externo do MySQL 3306 — a evidência de hardening é de dez/2025, precisa reconfirmação.
20. **Quem consome MySQL remotamente?** (Mac do Jhony? agentes? integração?) — determina se `bind-address=127.0.0.1` é viável ou se fica só o firewall.
21. **O `.patch` público do briefing §3.7 ainda existe?** O coletor não encontrou nenhum `.patch` em `public/` (find até profundidade 3) — pode já ter sido removido; confirmar com busca completa.

## Processo

- Responder questão = anexar evidência (saída de comando, hash, config) — nunca memória.
- Questão nova descoberta em qualquer lote entra aqui no mesmo lote.
- O coletor de evidências (scripts/basal/) responde total ou parcialmente: 1, 2, 5, 6, 12, 13.
