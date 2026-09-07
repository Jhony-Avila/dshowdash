# V4 ART EXPLORATION — POSTMORTEM

> Decisão **A+** (§29). Registro honesto da exploração de arte 2D na fase V4 e
> do porquê da **mudança obrigatória de método**. Escrito para que ninguém
> repita o caminho que bateu no teto — e para deixar claro que o teto foi de
> **processo de autoria**, não de formato (SVG) nem de ambição.

## O que se tentou

Elevar a arte 2D do Avatar Studio ao nível "high-end stylized character
creator / premium 2.5D" **digitando coordenadas Bézier à mão** dentro do motor
(`ParteDef.render` desenhando `path d="…"`), com sombreamento por material e
luz key. Protótipos (gitignored, `tools-golden/`):

| Estudo            | Alvo                              | Resultado honesto |
|-------------------|-----------------------------------|-------------------|
| `v4struct.ts`     | estrutura facial (máscara/manequim)| falhou (leitura de valor quebrada) |
| `v4B.ts`          | rosto "cel" direção B             | bug de composição — quase-preto não diagnosticado |
| `v4face.ts`       | rosto pictórico                   | ~7,5 (bom, não 8+) |
| `v4hand.ts`       | mão relaxada                      | ~6,5 |

## Por que bateu no teto

1. **Autoria cega.** Digitar `C x1 y1 x2 y2 x y` sem ver o traço enquanto se
   desenha é como esculpir de olhos vendados: cada curva exige um ciclo
   render→rasteriza→olha→corrige. O custo por curva é alto e o acúmulo de erro
   de forma cresce mais rápido que a correção.
2. **Forma e luz competindo no mesmo lugar.** Sem separar silhueta autoral de
   sombreamento procedural, "consertar" a luz distorcia a forma e vice-versa
   (o quase-preto do `v4B` foi exatamente isso: sombra grande + gradiente
   escuro se somando).
3. **Sem ferramenta de artista.** Curvas de nível de ilustração (dezenas a
   centenas de anchors por peça, máscaras, gradientes encaixados) são triviais
   em Illustrator/Figma e proibitivas na mão dentro do código.

O veredito honesto: **arte 6,5–7,5 chamada de 8+ é uma mentira cara.** Preferiu-
se reconhecer o teto real de execução a continuar moendo.

## Por que NÃO era o SVG

SVG segura centenas de Béziers, máscaras, clipping e gradientes — é o alvo
natural de export de qualquer ferramenta vetorial. O gargalo nunca foi o
formato; foi **quem/como** produz os vetores. A prova: o mesmo SVG, quando
**autorado numa ferramenta visual** e importado, não sofre nenhum dos três
problemas acima.

## A correção (o que mudou)

Separar **ENGINE** de **ART ASSET** (decisão A+ §3) e construir a
**infraestrutura de autoria**:

- `domain/heroAsset.ts` — contrato **HeroAsset2D** (SVG autorado + manifesto).
- `engine/heroAssetImport.ts` — importa o SVG **sem reconstruí-lo** (resolve
  uid/canais/materiais e distribui camadas pelos hooks). Prova de bytes:
  `hero-import.mjs` (16/16); prova visual: `13_V4_HERO_IMPORT_PROOF`.
- `V4_HERO_ASSET_TEMPLATE.svg` + `V4_ART_AUTHORING_KIT.md` — o idioma sem
  ambiguidade para o ilustrador (§21/§22).
- Fundações que **não** dependem de arte cega e já elevam a percepção:
  apresentação contextual (`engine/enquadramento.ts`), anatomia real por perfil
  e classes de caimento (`engine/partes/corpo.ts` + `engine/fit.ts`), domínio do
  calçado (`engine/footwear.ts`), gates independentes (`engine/gates.ts`).

## Lições

- **Método antes de esforço.** Mais horas de autoria cega não viram +1 ponto de
  qualidade; a mudança de ferramenta, sim.
- **Separar responsabilidades destrava.** Forma (artista) e composição (motor)
  em camadas distintas eliminam a competição forma×luz.
- **Honestidade de verdict é infraestrutura.** Gate de arte é **HUMAN_ONLY**;
  o motor nunca se auto-aprova (§17/§18). V3.2/V4 seguem **REWORK** até o
  veredito do Jhony (§20/§27).
- **A apresentação eleva a percepção sem tocar na fatura** — mas não a maquia.

## Estado

Arte final ≥8: **REWORK** (aguarda heroes autorados na ferramenta visual +
veredito humano). Infraestrutura de autoria/apresentação/corpo/fit/calçado:
**pronta e testada** (suíte verde). O caminho para 8+ agora é **autorar**,
não moer coordenadas.
