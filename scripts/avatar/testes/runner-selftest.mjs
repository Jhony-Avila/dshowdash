// Auto-teste do runner endurecido (C8). Prova, no SERVIDOR, os criterios da auditoria SEM
// interferir em outros servicos: todo processo de teste carrega um MARCADOR UNICO no proprio
// argv (via caminho de arquivo), e so medimos/matamos o que casa esse marcador exato.
// Nenhum kill amplo por nome generico (ex.: "sleep 600"): so o padrao unico desta execucao.
// Uso: node runner-selftest.mjs <caminho-do-rodar-todos.mjs-endurecido>
import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RUNNER = process.argv[2];
if (!RUNNER) { console.error('uso: node runner-selftest.mjs <runner.mjs>'); process.exit(2); }
const MARK = `RTSELF_${process.pid}_${Date.now()}`;   // marcador unico desta execucao (comeca com R)
const PORT = 47000 + (process.pid % 1000);             // porta de teste unica
const dir = mkdtempSync(join(tmpdir(), 'rt-selftest-'));
const out = {};
const set = (k, v) => { out[k] = v; console.log(`${k}=${v}`); };

// ---- fixtures: o NOME do arquivo contem o MARK, entao o argv do processo ('node <path>')
//      contem o MARK e e detectavel por pgrep -f de forma dirigida. ----
const F = (tag, body) => { const p = join(dir, `${MARK}__${tag}.mjs`); writeFileSync(p, `// ${MARK} ${tag}\n${body}`); return p; };
const KEEP = 'setInterval(()=>{},1000000);';
const pass = F('pass', `console.log('${MARK} pass'); process.exit(0);`);
const fail = F('fail', `console.log('${MARK} fail'); process.exit(3);`);
const hang = F('hang', `console.log('${MARK} hang'); ${KEEP}`);
// arvore de descendentes: cada nivel roda 'node <arquivo-com-MARK>' (marcador no argv, sem env, sem sleep global)
const descA = F('descA', KEEP);                                                              // neto (nivel 2) do caso child
const childSrc = F('child', `import {spawn} from 'node:child_process'; spawn(process.execPath,['${descA}'],{stdio:'ignore'}); console.log('${MARK} child'); ${KEEP}`);
const descC = F('descC', KEEP);                                                              // bisneto (nivel 3)
const midB = F('midB', `import {spawn} from 'node:child_process'; spawn(process.execPath,['${descC}'],{stdio:'ignore'}); ${KEEP}`);
const grand = F('grand', `import {spawn} from 'node:child_process'; spawn(process.execPath,['${midB}'],{stdio:'ignore'}); console.log('${MARK} grand'); ${KEEP}`); // nivel 1->2->3
const port = F('port', `import http from 'node:http'; http.createServer((_q,r)=>r.end('ok')).listen(${PORT},'127.0.0.1',()=>console.log('${MARK} port up ${PORT}')); ${KEEP}`);
const ignterm = F('ignterm', `process.on('SIGTERM',()=>{}); console.log('${MARK} ignterm'); ${KEEP}`);

function runRunner(tests, extraEnv, sendSignalAfterMs) {
  // roda o runner com SUITE_TESTS_JSON; retorna {so, code, signal}
  return new Promise((res) => {
    const env = { ...process.env, SUITE_TESTS_JSON: JSON.stringify(tests), SUITE_PER_TEST_MS: '3000', ...extraEnv };
    const ch = spawn('node', [RUNNER], { env });
    let so = '';
    ch.stdout.on('data', d => so += d); ch.stderr.on('data', d => so += d);
    if (sendSignalAfterMs) setTimeout(() => { try { ch.kill(sendSignalAfterMs.sig); } catch (e) {} }, sendSignalAfterMs.ms);
    ch.on('exit', (code, signal) => res({ so, code, signal }));
  });
}
// bracket-trick: evita que o proprio 'bash -c "pgrep -f ..."' seja contado (auto-match do pgrep -f).
const rx = (p) => `[${p[0]}]${p.slice(1)}`;
const conta = (pat) => { const r = spawnSync('bash', ['-c', `pgrep -fc "${rx(pat)}" 2>/dev/null | head -1`]); return Number((r.stdout || '0').toString().trim()) || 0; };
const portaAberta = (p) => { const r = spawnSync('bash', ['-c', `ss -ltn 2>/dev/null | grep -c ":${p} " | head -1`]); return Number((r.stdout || '0').toString().trim()) || 0; };
const matarMark = () => spawnSync('bash', ['-c', `pkill -9 -f "${rx(MARK)}" 2>/dev/null; true`]);
const espera = (ms) => new Promise(z => setTimeout(z, ms));

try {
  // 1) sucesso + 2) falha + exit code + logs
  let r = await runRunner([pass, fail]);
  set('RUNNER_SUCCESS_CASE', /\[PASS\]/.test(r.so) && new RegExp(`${MARK} pass`).test(r.so) ? 'PASS' : 'FAIL');
  set('RUNNER_FAILURE_CASE', /\[EXIT_NONZERO\]/.test(r.so) ? 'PASS' : 'FAIL');
  set('RUNNER_EXIT_CODE', r.code === 1 ? 'PASS' : `FAIL(${r.code})`);
  set('RUNNER_LOG_PRESERVATION', new RegExp(`${MARK} fail`).test(r.so) ? 'PASS' : 'FAIL');

  // 3) timeout + resumo TIMEOUTS
  r = await runRunner([hang]);
  set('RUNNER_TIMEOUT_CASE', /TIMED_OUT/.test(r.so) && /TIMEOUTS\(/.test(r.so) ? 'PASS' : 'FAIL');

  // 4) child cleanup (nivel 2: o neto disparado pelo teste)
  matarMark(); await runRunner([childSrc]); await espera(1500);
  set('RUNNER_CHILD_CLEANUP', conta(MARK) === 0 ? 'PASS' : `FAIL(${conta(MARK)})`);

  // 5) grandchild cleanup (nivel 3: bisneto na arvore do teste)
  matarMark(); await runRunner([grand]); await espera(1500);
  set('RUNNER_GRANDCHILD_CLEANUP', conta(MARK) === 0 ? 'PASS' : `FAIL(${conta(MARK)})`);

  // 6) port cleanup
  matarMark(); await runRunner([port]); await espera(1500);
  set('RUNNER_PORT_CLEANUP', portaAberta(PORT) === 0 ? 'PASS' : `FAIL(porta ${PORT} aberta)`);

  // 7) TERM->KILL: teste ignora SIGTERM; runner deve escalar p/ SIGKILL e nao deixar orfao
  matarMark(); await runRunner([ignterm]); await espera(1500);
  set('RUNNER_SIGKILL_ESCALATION', conta(MARK) === 0 ? 'PASS' : `FAIL(${conta(MARK)})`);

  // 8) invalid timeout -> aborta rc=2
  r = await runRunner([pass], { SUITE_PER_TEST_MS: 'abc' });
  const r2 = await runRunner([pass], { SUITE_PER_TEST_MS: '0' });
  const r3 = await runRunner([pass], { SUITE_PER_TEST_MS: '-5' });
  set('RUNNER_INVALID_TIMEOUT', (r.code === 2 && r2.code === 2 && r3.code === 2) ? 'PASS' : `FAIL(${r.code}/${r2.code}/${r3.code})`);

  // 9/10) SIGINT/SIGTERM no runner enquanto roda um hang -> cleanup do grupo do teste
  matarMark();
  await runRunner([hang], {}, { sig: 'SIGINT', ms: 1200 }); await espera(1500);
  set('RUNNER_SIGINT_CLEANUP', conta(MARK) === 0 ? 'PASS' : `FAIL(${conta(MARK)})`);
  matarMark();
  await runRunner([hang], {}, { sig: 'SIGTERM', ms: 1200 }); await espera(1500);
  set('RUNNER_SIGTERM_CLEANUP', conta(MARK) === 0 ? 'PASS' : `FAIL(${conta(MARK)})`);

  // 11) duracao no resumo
  set('RUNNER_DURATION_REPORT', /DURACOES_TOP10_S|dur=/.test((await runRunner([pass])).so) ? 'PASS' : 'FAIL');
} finally {
  matarMark();
  rmSync(dir, { recursive: true, force: true });
}
const vals = Object.values(out);
const allPass = vals.every(v => v === 'PASS');
console.log(`\nRUNNER_SELFTEST_OVERALL=${allPass ? 'PASS' : 'FAIL'}`);
process.exit(allPass ? 0 : 1);
