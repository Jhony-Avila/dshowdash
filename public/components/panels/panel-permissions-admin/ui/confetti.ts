// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-confetti
// PURPOSE: UARPS Admin - Confetti Animation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   burst() — exported function
//   rain() — exported function
//   celebrate() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   Confetti — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-confetti';

const COLORS = ['#7C3AED', '#22C55E', '#06B6D4', '#EC4899', '#EAB308', '#EF4444'];
const SHAPES = ['square', 'circle'];

export function burst(options: Record<string, unknown> = {}) {
  if (!options) options = {};
  const x = options.x !== undefined ? Number(options.x) : window.innerWidth / 2;
  const y = options.y !== undefined ? Number(options.y) : window.innerHeight / 2;
  const count = options.count !== undefined ? Number(options.count) : 50;
  const spread = options.spread !== undefined ? Number(options.spread) : 360;
  const duration = options.duration !== undefined ? Number(options.duration) : 3000;

  const container = document.createElement('div');
  container.className = 'uarps-confetti';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'uarps-confetti__particle';
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const angle = (spread / count) * i + (Math.random() * 20 - 10);
    const velocity = 300 + Math.random() * 200;
    const rotation = Math.random() * 360;
    const size = 6 + Math.random() * 8;
    particle.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};border-radius:${shape === 'circle' ? '50%' : '2px'};transform:rotate(${rotation}deg);--angle:${angle}deg;--velocity:${velocity}px;animation-duration:${duration}ms;animation-delay:${Math.random() * 200}ms;`;
    container.appendChild(particle);
  }
  setTimeout(() => { container.remove(); }, duration + 500);
}

export function rain(options: Record<string, unknown> = {}) {
  if (!options) options = {};
  const duration = options.duration !== undefined ? Number(options.duration) : 3000;
  const intensity = options.intensity !== undefined ? Number(options.intensity) : 30;

  const container = document.createElement('div');
  container.className = 'uarps-confetti';
  document.body.appendChild(container);

  const interval = setInterval(() => {
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.className = 'uarps-confetti__particle';
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const xPos = Math.random() * window.innerWidth;
      const size = 6 + Math.random() * 6;
      const fallDuration = 2000 + Math.random() * 1000;
      particle.style.cssText = `left:${xPos}px;top:-20px;width:${size}px;height:${size}px;background:${color};border-radius:2px;animation-duration:${fallDuration}ms;`;
      container.appendChild(particle);
      ((p, fd) => { setTimeout(() => { p.remove(); }, fd); })(particle, fallDuration);
    }
  }, 1000 / intensity);

  setTimeout(() => { clearInterval(interval); setTimeout(() => { container.remove(); }, 3000); }, duration);
}

export function celebrate() { burst({ count: 80, spread: 360 }); setTimeout(() => { burst({ x: window.innerWidth * 0.3, count: 40 }); }, 200); setTimeout(() => { burst({ x: window.innerWidth * 0.7, count: 40 }); }, 400); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { burstReady: typeof burst === 'function' } }; }

export const Confetti = { burst, rain, celebrate, VERSION, MODULE_ID, info, healthCheck };
export default Confetti;
