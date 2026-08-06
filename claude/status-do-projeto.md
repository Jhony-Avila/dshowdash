# Status do Projeto — Avatar Studio (no repo)

> Fonte viva: docs do projeto Claude "Avatar Studio" (04-status-do-projeto).
> Última atualização: **2026-08-06, onda 511–610 (trilho A ESGOTADO)**.

## Marco atual

- **510 megas EM PRODUÇÃO** (deploy `15620cdd → 525d326c`, 2026-08-06 10:45).
- **Onda 511–610 PRONTA nesta árvore** (100 megas, 9 lotes de implementação
  + validação 1-por-1; rollback §651 por flag). Suíte: **81 arquivos,
  81/81 VERDES** na rodada completa desta entrega.
- Esta onda ESGOTA o trilho A: i18n cobertura §296 · foto entrada §321 ·
  foto pro2 §335–371 · conjuntos §72.1/.3 · criação fina §102.2 + borda
  §340–341 · palco/som v3 §176.1/§178.2/§157.4 · infra v3 §268/§277/
  §299–300 · ux final §59.1/§60/§64.2/§545. O que resta do briefing está
  no trilho B (Jhony) ou C (estratégico) — ver mapa de lacunas.
- Decisões **#61/#62/#63** registradas (projeto docs 16–17 + resumo aqui).
- **Validação 1-por-1**: projeto doc `claude/17-validacao-onda-511-610.md`
  (por flag: §§ · teste · roteiro visual de 1 min).

## Como retomar (sessão nova)

1. Clonar; ler `claude/*.md`. 2. Briefing: `git show 006a394b:docs/BRF_AVATAR_STUDIO.md`.
3. Build DENTRO do dir do painel; harness da RAIZ; servidor 8901 de public/.
4. Push: dry-run; 403 → bloco SSH (comprovado 6×). 5. Próximo: trilho B
   (depende do Jhony: zip UBC, chave IA, endpoints); decisões a partir de
   **#64**.

## Pendências (Jhony)

Validação visual 221–610 (roteiros no doc 17) · webhook (re-rotação do
secret — entregas GitHub seguem 403) · chave IA · zip UBC · rotação PAT ·
nexatechs.com.br · trilho C.
