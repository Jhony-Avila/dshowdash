# Google Analytics — FASE 3: inteligência, Diretoria e exportação

> Entregue em **2026-07-30**, commit `c7fff04`. Verificação: `bash scripts/ga-smoke-all.sh`
> (29 checagens) + prova de UI com **139**.

Estado: **24 telas com dados · 18 rotas**.

---

## 1. Insights com estatística, não texto fixo (§50)

`GET /insights`. A diferença entre esta tela e o painel "Exige atenção" é o método: lá são
limiares (`caiu mais de 15%`), aqui há estatística sobre a própria série.

| Regra | Como |
|---|---|
| **Dia atípico** | z-score sobre sessões. `\|z\| ≥ 2` reporta; `≥ 3` vira confiança alta. Exige **7 dias** no mínimo |
| **Tendência** | regressão linear (mínimos quadrados). Só reporta inclinação **≥ 1% da média por dia** |
| Landing sem conversão | ≥ 200 sessões de entrada e zero eventos importantes |
| Dispositivo desproporcional | ≥ 500 usuários e taxa abaixo da **metade** do melhor |
| Atribuição de leads | compara origem dos leads no Pipedrive (**dado real**) |

Os pisos existem para evitar falso positivo: com menos de 7 pontos o desvio padrão é instável e
acusa qualquer oscilação; abaixo de 1%/dia a inclinação é ruído com cara de tendência.

⚠️ **Todo insight carrega a evidência numérica que o gerou**, e a tela mostra o **método** de
cada regra. Sem isso, "insight" é opinião com cara de análise — e o usuário não tem como
discordar da conclusão.

⚠️ A tela **declara a limitação**: z-score não é robusto a valores extremos. Um pico muito forte
infla o desvio padrão do período e pode mascarar um vale no mesmo intervalo — é exatamente o que
acontece no cenário "dia atípico", onde o pico aparece e o vale não.

---

## 2. 🔴 Dois bugs meus que só a medição pegou

As regras estatísticas **não disparavam** na série regular do mock. Código de análise que nunca
roda é código que ninguém sabe se funciona — então criei dois cenários para exercitá-las
(`anomalia_dia`, `tendencia_queda`). Aí os defeitos apareceram:

**1. O cenário `tendencia_queda` reportava tendência de ALTA.**
Minha fórmula usava `dia_do_ano % 40`. O `%` **reseta**, criando dente de serra em vez de
declínio — e a regressão linear, corretamente, encontrava inclinação positiva no trecho. O
cenário fazia o oposto do que o nome promete. Corrigido para declínio monotônico pela distância
até hoje.

**2. O pico do dia 11 não disparava.**
Eu **multiplicava** o valor do dia por 2,9 — mas o valor já embutia o peso do dia da semana.
Quando o dia 11 caía num sábado (peso 0,52), o "pico" virava 1,5× a média e o z-score nem
chegava a 2. Corrigido: o pico **substitui** o valor em vez de multiplicar.

Depois das correções: **z = +3,94** (confiança alta) e **tendência de queda de −2,4%/dia**.

---

## 3. Diretoria (§10.1)

Recorte executivo, não a Visão Geral com fonte maior: 4 KPIs com variação contra o período
anterior, série com comparação, bloco **"Exige decisão"** (só severidade alta) e o funil do site
ao CRM.

⚠️ **As larguras das barras do funil são ilustrativas, e a tela diz isso.** Com um lado simulado
(GA4) e outro real (CRM), a proporção entre etapas é desenho, não informação — por isso
**nenhuma taxa de passagem é exibida** ali.

---

## 4. Exportação CSV (§51.2)

`lib/csv.ts` + botão no `Grid`. Sem biblioteca: `Blob` + `URL.createObjectURL` resolvem, e
instalar um pacote de XLSX mexeria no `package.json` da raiz.

⚠️ **Três detalhes decidem se o arquivo abre certo no Excel pt-BR:**

1. **separador `;`** — com vírgula, tudo cai numa coluna só e o usuário conclui que a exportação
   está quebrada;
2. **BOM UTF-8** — sem ele o Excel lê como Latin-1 e "Localizações" vira "LocalizaÃ§Ãµes". Um
   caractere invisível separa arquivo usável de arquivo lixo;
3. **decimal com vírgula** — senão o Excel trata número como texto e não soma. É o inverso do
   problema que este projeto já teve na entrada monetária (`Number("12,50")` = NaN).

Coluna sem `csv` é omitida do arquivo: `render` devolve JSX e exportaria `[object Object]`.
Colunas que só desenham barra ou badge não têm o que exportar.

---

## 5. ⚠️ Duas falhas da própria prova

Ambas fizeram a prova reprovar **código correto**. Ficam documentadas porque o erro é fácil de
repetir:

- **BOM verificado em `Blob.text()`**: esse método decodifica UTF-8 e **consome** o BOM. Os bytes
  `EF BB BF` estavam corretos no arquivo. Agora a prova lê `arrayBuffer()` e checa os bytes.
- **Troca de cenário antes de navegar**: o insight de pico não aparecia e eu quase concluí que a
  regra estava quebrada — o backend estava certo o tempo todo. Agora a prova navega primeiro,
  troca o cenário depois, e **confirma que o `select` aceitou o valor** antes de medir.

---

## 6. O que a Fase 3 NÃO fez

| Item | Por quê |
|---|---|
| Drill-down por UF | O filtro global não tem dimensão de região; exige mudar `ga_filtros()` e aplicar o corte em todos os métodos. Fica para a Fase 4, junto com o dado real |
| XLSX e PDF (§51.2) | CSV cobre o uso real (abrir no Excel). XLSX exigiria biblioteca nova no `package.json` da raiz |
| Relatórios salvos / agendamento (§51) | Depende de banco próprio do módulo, que não existe |
| Ícone no header (§9) | **Quarta fase seguida.** O header é servido bundlado e a sessão paralela segue com `panel-calendar` não commitado; rebuildar empacotaria trabalho dela pela metade |
