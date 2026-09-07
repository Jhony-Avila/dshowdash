# CHEAPNESS_TELLS_V42 — lista formal de defeitos visuais (§10)

> "Barato" não é opinião vaga: é **bug**. Qualquer Hero que exiba um destes
> sinais entra em **REWORK** (§10). Esta lista é o critério de reprovação usado
> no scorecard (§50) e o checklist negativo de todo ART REQUEST V4.2.

## Defeitos (qualquer um reprova)
- **mão em garra** / dedos como tiras
- **pé triangular** / sapato como slipper
- **pernas-tubo · braços-tubo · pescoço-tubo**
- corpo **excessivamente simétrico** / **postura de manequim** (montado vertical)
- **olhos de boneca** / **orelhas circulares** / **nariz-símbolo**
- **cabelo capacete** / touca / **afro feito de bolas/massa chapada** / **barba máscara**
- **roupa caixa** / **blazer armadura** / **hoodie bloco**
- tecido representado **só por linhas**
- **gradients genéricos** para fingir volume
- asset que parece **procedurally generated** / excesso de simetria perfeita

## Estado atual medido (§46/§47/§48 — evidência nos boards)
Diagnóstico honesto do trilho premium ATUAL, por Hero (ver `00_V42_MASTER.png`):

| Hero | Nota | Tells presentes hoje |
|---|---|---|
| BODY | 5/10 | pescoço-tubo, braços-tubo, mão-garra, pé-triângulo, simetria de manequim |
| FACE | 4/10 | olhos de boneca, nariz-símbolo, orelhas circulares, features sobre oval |
| HAIR | 3/10 | short = entrada rala; afro = massa chapada (não textura/volume) |
| HAND | 3/10 | garra/espeto (engine) · luva/mitten (tentativa hand-code) |
| FOOTWEAR | 2/10 | sem arte; pé = cunha triangular |
| T-SHIRT | 4/10 | cor de torso; sem construção |
| HOODIE | 4/10 | bloco; sem peso/gravidade/drape |
| BLAZER | 4/10 | sem alfaiataria; troca de cor de torso |
| FULL CHARACTER | 4/10 | busto vetorial de app; silhueta preta ilegível |

## Barra de aceite (§51)
- **8/10 = produto profissional.** Não existe "era 3, virou 6, então ótimo" (§51).
- Testes obrigatórios por asset: **BLACK** (silhueta lê o assunto sem linha),
  **GRAYSCALE** (premium sem depender de cor, §48), **TARGET SIZE** (lê no
  tamanho real do stage, §49).
- Head-to-toe **coerência de tratamento** (edge/light/value/detail/stylization) — §18.
