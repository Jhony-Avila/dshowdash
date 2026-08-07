# Status do Projeto — Avatar Studio (no repo)

> Fonte viva: docs do projeto Claude "Avatar Studio" (04-status-do-projeto).
> Última atualização: **2026-08-07, onda 611–710 em curso (trilho B/UBC)**.

## Marco atual

- **610 megas EM PRODUÇÃO** (deploy `525d326c → f25ea274`, 2026-08-07).
- **Onda 611–710 EM CURSO (trilho B/UBC — decisão #64)**: 611–620 pipeline
  v2 + bases Superhero M/F publicadas · 621–630 Character Assembler §406 +
  6 cabelos/barba · 631–640 roupas §415–§417 (20 peças, body masking
  §415.2) · 641–650 materiais §418–§421 (Material Manager §419, canais
  §73→3D §420–§421, decisão #65) · 651–660 cabelo/barba/morfos (barba
  combinável §425, famílias §423, morfos estruturais via escala §412–§414,
  decisão #66) · 661–670 animação (manager §432, máquina §433, pacote
  UAL §436, olhar §439, decisão #67). Flags: as5.assembler3d ·
  as5.roupas3d · as5.materiais3d · as5.cabelo3d · as5.morfos3d ·
  as5.animacao3d. Suíte: **86 arquivos**.
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
4. Push: dry-run; 403 → bloco SSH (comprovado 11×). 5. Próximo: seguir o
   mapa da onda 611–710 (doc 18 do projeto Claude) a partir do lote
   671–680 (LOD/progressivo §461–§478); decisões a partir de **#68**.
   Pendente do bloco 669: publicar o pacote UAL (consulta de clipes sai
   no próprio bloco).

## Pendências (Jhony)

Validação visual 221–610 (roteiros no doc 17) · webhook (re-rotação do
secret — entregas GitHub seguem 403) · chave IA · zip UBC · rotação PAT ·
nexatechs.com.br · trilho C.
