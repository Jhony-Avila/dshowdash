# AS5 — Fase 6: Photo Studio (§632; P7 §319–§397)

**Fontes lidas:** §632 na íntegra · P7 completa via índice (§319–§397) + normativas §326–§327 (templates).

## Entregue (F6 incremento 1 — composição rápida)

1. **§326/§327 TEMPLATES**: TEMPLATES_FOTO no catálogo — os 7 prioritários
   (Dshow Executive, Showroom Master, Cyber Profile, Pro Player, Minimal
   Clean, Achievement Reveal, China Trip) com assets REAIS + categoria
   §326.1. Aplicação §326.3: itens bloqueados ficam DE FORA e a mensagem
   informa quantos; a foto do usuário nunca é tocada. Strip na UI + Limpar.
2. **§368 EXPORTAÇÃO**: rasterizarSvg parametrizado + Baixar PNG local em
   escala (480/960/1920) — download direto, sem passar pelo servidor.
3. **§362 AUTOSAVE do estilo**: rascunho dos PARÂMETROS (nunca a foto) em
   localStorage; reabrir o modo estilizada retoma o estilo anterior com
   aviso; Limpar/salvar-com-sucesso encerram o rascunho.

## JÁ-EXISTIA (4.6 §21)

Foto simples/estilizada · upload+câmera+galeria · recorte com zoom/pan ·
composição determinística no engine (render-foto medalhão 240×240) ·
rasterização PNG 480 + parâmetros re-validados no servidor.

## FALTA (por dependência)

- **Editor completo (6.1 Core)**: projetos/canvas/camadas/máscaras/blend
  (§338–§342), tipografia (§343) — é um produto por si; entra como programa
  próprio pós-AS5 ou fatias na F9.
- **§325 formatos não-quadrados** (header/banner/wallpaper): exigem
  RECOMPOSIÇÃO wide do render-foto (layout novo, não só resize) — F9.
- **§329 captura 3D** → pós-UBC (gate §631).
- **§335–§336/§354–§359 IA** (remoção de fundo, retrato, expansão) → F8
  (ANTHROPIC_API_KEY pendente) e serviços de imagem próprios.
- **§363–§367 projetos/versões/publicação multi-destino** → precisam de
  schema de projetos no servidor (junto do passo root §619).
