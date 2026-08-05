# Mapa de Lacunas do Briefing — v3 (pós lote 221–230, 2026-08-05)

> Método: briefing (006a394b, 1.764 §§) cruzado por evidência com o código.
> v2 completa nos docs do projeto Claude; aqui o delta operacional.

## O que o lote 221–230 fechou

- §323/§323.1–.3 arquitetura 3 regiões · §324/§324.1–.2 canvas profissional
  (zoom/pan/grade/safe/snapping/guias) · §344 título-componente ·
  §345/§345.1 emblemas com layout automático · §175/§175.1 editor de
  showcase + automático · §220 timeline no shell · §229 favoritos em 3
  categorias · §1076 vitrine pessoal · §1077 galerias (recorte local).

## TRILHO A — implementável agora (sem bloqueio externo)

**A1 · Photo Studio PRO (restante)**: correções locais finas (§333–334
parcial ok), máscaras de camada (§340–341 além da forma), publicação/
derivação no Dash (§365–366), presets de exportação named (§369), histórico
VISUAL do §361, versionamento de projetos §364 v2 (hoje 6 slots).
**A2 · Palco**: poderes "Ativar" + preview (§153–155), cenários prioritários/
hora do dia (§160–162), luz 2D §164, editores de moldura/banner/título
(§166–172).
**A3 · Criação 2D**: tipo corporal §102, presets faciais §105, granularidade
§108–111, barba §114, personalidade/postura §117–118, idle 2D §119, emotes
§120.
**A4 · Progressão**: página de coleção com hero/lore (§207–214), página de
conquistas real (§215–219, §221 parcial), economia de assets (§225–228),
comparação de presets §231.
**A5 · 3D sem UBC**: piscar/respiração §440–441, environment maps §449,
pós-processamento §457, material manager §419–420 (tinta parcial), partículas
3D §444–446.
**A6 · Fundações**: asset manifest §267, streaming §274–275, design tokens
§283–289, logging §291 v2.

## TRILHO B — bloqueado em itens do Jhony

Zip UBC (morphs §412–414, roupas §416, sockets §426–431, física §424, root
motion §437) · Chave IA (P13 inteiro, §232-IA, §355–358) · Infra P16.

## TRILHO C — estratégico (decidir antes de codar)

P11 CMS admin · P12 plataforma · P14 social server-side (o recorte
client-side §1076/§1077 já entrou) · P17 monorepo · P18 processos.

## Sequência recomendada (próximos lotes)

1. **231–240**: A2 palco (poderes §153–155 + cenários §160–162 + editores
   §166–172) — apresentação é a vitrine do produto.
2. **241–250**: A4 progressão (página de coleção §207–214 + conquistas
   §215–221 + economia §225–228).
3. **251–260**: A1 restante + A3 granularidade facial.
4. A5/A6 diluídos como sempre.
