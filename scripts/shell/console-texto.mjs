// scripts/shell/console-texto.mjs — normalização e classificação do texto de console capturado pelo Playwright nos smokes
// (gestão de painéis, lotties, rotas, flags). Fonte única: os quatro smokes importam daqui.
//
// 1) O logger do shell emite console.error('%c…', 'color: …; font-weight: …', mensagem). O text() do Playwright concatena os
//    marcadores %c e os argumentos de estilo ANTES da mensagem real; um corte curto (160–200c) deixava só
//    "[ERROR] [container-ma…" nos relatórios. limparTextoConsole() remove marcadores e declarações CSS (só quando há %c,
//    para não mutilar mensagens legítimas que citem "color:"), e LIMITE_CONSOLE preserva a mensagem inteira.
// 2) A telemetria de performance do bootstrap do shell (bootstrap/phases/phase2-performance.ts → logger.error('Performance
//    critical:', alert)) chega como console.error, é esporádica, depende do tempo de execução da máquina do bot e não é erro
//    de painel. Medida em produção 1531529e (14–15/09/2026): 3 ocorrências em 10 execuções, sempre com todos os gates
//    funcionais PASS e 0 pageerror. ehTelemetriaPerfShell() reconhece SÓ esse padrão; qualquer outro console.error segue
//    sendo falha nos gates.
export const LIMITE_CONSOLE = 600;
const RE_ESTILO = /\b(?:color|background(?:-color)?|font(?:-weight|-style|-size|-family)?|padding|margin|border(?:-radius)?|text-decoration|display)\s*:[^;]*;?/g;
export const limparTextoConsole = (t) => {
  const s = String(t || '');
  const semEstilo = /%c/.test(s) ? s.replace(/%c/g, '').replace(RE_ESTILO, '') : s;
  return semEstilo.replace(/\s{2,}/g, ' ').trim();
};
// "[container-main:bootstrap.config.states] Performance critical: {moduleId: container-main:logger, data: Object}"
export const RE_PERF_SHELL = /\[container-main:[\w.-]+\]\s*Performance critical:/;
export const ehTelemetriaPerfShell = (t) => RE_PERF_SHELL.test(String(t || ''));
// Classifica uma ConsoleMessage do Playwright: { tipo, texto (limpo e truncado), perfShell } — perfShell só para tipo 'error'.
export const classificarConsole = (m) => {
  const tipo = m.type();
  const texto = limparTextoConsole(m.text()).slice(0, LIMITE_CONSOLE);
  return { tipo, texto, perfShell: tipo === 'error' && ehTelemetriaPerfShell(texto) };
};
