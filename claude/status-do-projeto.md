# Status do Projeto — Avatar Studio (no repo)

> Fonte viva: docs do projeto Claude "Avatar Studio" (04-status-do-projeto).
> Última atualização: **2026-08-06, onda 311–410**.

## Marco atual

- **310 megas EM PRODUÇÃO** (deploy `72d1993f → 794da8f9`, 2026-08-05 23:13).
- **Onda 311–410 PRONTA nesta árvore** (100 megas, 10 commits temáticos —
  um por lote; flags novas em `nucleo/flags.ts`, todas ON, rollback §651
  por flag). Suíte: **63 arquivos** + nucleo.test.
- Espelho PHP novo: nitidez §333 (0–1), formas estrela/escudo §341,
  marca §372 (whitelist ≤16) em `api/avatar/studio.php` (php -l verde).
- Decisões **#57/#58** registradas (projeto doc 14 + resumo aqui).

## Como retomar (sessão nova)

1. Clonar; ler `claude/*.md`. 2. Briefing: `git show 006a394b:docs/BRF_AVATAR_STUDIO.md`.
3. Build DENTRO de public/components/panels/panel-avatar-studio; harness da
   RAIZ; servidor 8901 de public/. 4. Rota de push: dry-run; 403 → bloco SSH
   (comprovado 4×). 5. Próxima onda: mega **411+**; decisões a partir de
   **#59**; candidatos em `claude/mapa-lacunas.md`.

## Pendências (Jhony)

Validação visual 221–410 · webhook (re-rotação do secret; entregas GitHub
seguem 403) · chave IA · zip UBC · rotação PAT · nexatechs.com.br · trilho C.
