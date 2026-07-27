const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-confetti";
const COLORS = ["#7C3AED", "#22C55E", "#06B6D4", "#EC4899", "#EAB308", "#EF4444"];
const SHAPES = ["square", "circle"];
function burst(options = {}) {
  if (!options) options = {};
  const x = options.x !== void 0 ? Number(options.x) : window.innerWidth / 2;
  const y = options.y !== void 0 ? Number(options.y) : window.innerHeight / 2;
  const count = options.count !== void 0 ? Number(options.count) : 50;
  const spread = options.spread !== void 0 ? Number(options.spread) : 360;
  const duration = options.duration !== void 0 ? Number(options.duration) : 3e3;
  const container = document.createElement("div");
  container.className = "uarps-confetti";
  document.body.appendChild(container);
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.className = "uarps-confetti__particle";
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const angle = spread / count * i + (Math.random() * 20 - 10);
    const velocity = 300 + Math.random() * 200;
    const rotation = Math.random() * 360;
    const size = 6 + Math.random() * 8;
    particle.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${color};border-radius:${shape === "circle" ? "50%" : "2px"};transform:rotate(${rotation}deg);--angle:${angle}deg;--velocity:${velocity}px;animation-duration:${duration}ms;animation-delay:${Math.random() * 200}ms;`;
    container.appendChild(particle);
  }
  setTimeout(() => {
    container.remove();
  }, duration + 500);
}
function rain(options = {}) {
  if (!options) options = {};
  const duration = options.duration !== void 0 ? Number(options.duration) : 3e3;
  const intensity = options.intensity !== void 0 ? Number(options.intensity) : 30;
  const container = document.createElement("div");
  container.className = "uarps-confetti";
  document.body.appendChild(container);
  const interval = setInterval(() => {
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement("div");
      particle.className = "uarps-confetti__particle";
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const xPos = Math.random() * window.innerWidth;
      const size = 6 + Math.random() * 6;
      const fallDuration = 2e3 + Math.random() * 1e3;
      particle.style.cssText = `left:${xPos}px;top:-20px;width:${size}px;height:${size}px;background:${color};border-radius:2px;animation-duration:${fallDuration}ms;`;
      container.appendChild(particle);
      ((p, fd) => {
        setTimeout(() => {
          p.remove();
        }, fd);
      })(particle, fallDuration);
    }
  }, 1e3 / intensity);
  setTimeout(() => {
    clearInterval(interval);
    setTimeout(() => {
      container.remove();
    }, 3e3);
  }, duration);
}
function celebrate() {
  burst({ count: 80, spread: 360 });
  setTimeout(() => {
    burst({ x: window.innerWidth * 0.3, count: 40 });
  }, 200);
  setTimeout(() => {
    burst({ x: window.innerWidth * 0.7, count: 40 });
  }, 400);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { burstReady: typeof burst === "function" } };
}
const Confetti = { burst, rain, celebrate, VERSION, MODULE_ID, info, healthCheck };
var confetti_default = Confetti;
export {
  Confetti,
  MODULE_ID,
  VERSION,
  burst,
  celebrate,
  confetti_default as default,
  healthCheck,
  info,
  rain
};
