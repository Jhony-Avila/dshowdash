#!/usr/bin/env node
// scripts/avatar/motor/render-cli.mjs — renderiza UM avatar com o ARTEFATO exportado, num contexto vm SEM globais do host
// (a mesma condição do JavaScriptCore). Usado por golden-publicados.php e pelos testes de paridade do backend do app.
//   uso: node render-cli.mjs <motor-<versao>.js>   stdin: {"config":{…},"flags":{"as6.x":true}}   stdout: SVG (svgDe(validarConfig(config)))
//   saída 2 = erro de uso; 3 = config inválida.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const [arq] = process.argv.slice(2);
if (!arq) { console.error('uso: render-cli.mjs <motor.js> < pedido.json'); process.exit(2); }
const codigo = readFileSync(arq, 'utf8');
const entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
const ctx = vm.createContext(Object.create(null));
vm.runInContext(codigo, ctx, { filename: 'motor.js', timeout: 5000 });
ctx.__pedido = JSON.stringify(entrada);
const svg = vm.runInContext(`(() => {
  const M = DSHOWAvatarMotor; const p = JSON.parse(__pedido);
  if (p.flags && typeof p.flags === 'object') M.definirFlags(p.flags);
  let cfg; try { cfg = M.validarConfig(p.config); } catch (e) { return '\\u0000' + String(e && e.message || e); }
  return M.svgDe(cfg);
})()`, ctx, { timeout: 5000 });
if (typeof svg !== 'string' || svg.startsWith('\u0000')) { console.error('config inválida: ' + String(svg).slice(1)); process.exit(3); }
process.stdout.write(svg);
