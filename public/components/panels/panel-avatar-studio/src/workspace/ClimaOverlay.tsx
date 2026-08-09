// workspace/ClimaOverlay.tsx — overlay de CLIMA do palco 2D (§163).
// @version 1.0.0  @created 2026-08-09  (lote 901–910, decisão #91 —
// componentização fase 3 do ShellStudio; DOM byte a byte com o bloco
// que vivia inline no viewport desde o lote 201)
//
// Determinístico, sobre o cenário e atrás dos controles; reduced-motion
// desliga o movimento (§182). Puro: (clima, movReduzido) → SVG.
// (tipo estrutural — compatível com o ClimaPalco do ShellStudio)
type ClimaPalco = 'limpo' | 'chuva' | 'neve' | 'nevoa';

export function ClimaOverlay({ clima, movReduzido }: { clima: ClimaPalco; movReduzido: boolean }) {
  if (clima === 'limpo') return null;
  return (
    <svg className="avst5-clima" aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" data-teste="clima-overlay">
      {clima === 'chuva' && Array.from({ length: 26 }, (_, i) => (
        <line key={i} x1={(i * 61) % 400} y1={-20 - ((i * 37) % 60)} x2={((i * 61) % 400) - 8} y2={4 - ((i * 37) % 60)}
          stroke="#9db4ff" strokeWidth="1.1" opacity="0.5">
          {!movReduzido && (
            <animateTransform attributeName="transform" type="translate" from="0 0" to="-40 340"
              dur={`${(1.1 + (i % 5) * 0.14).toFixed(2)}s`} repeatCount="indefinite" />
          )}
        </line>
      ))}
      {clima === 'neve' && Array.from({ length: 22 }, (_, i) => (
        <circle key={i} cx={(i * 73) % 400} cy={-8 - ((i * 41) % 40)} r={1.4 + (i % 3) * 0.7}
          fill="#e6eaf2" opacity="0.75">
          {!movReduzido && (
            <animateTransform attributeName="transform" type="translate" from="0 0" to={`${(i % 2 ? 18 : -14)} 330`}
              dur={`${(4 + (i % 6) * 0.8).toFixed(2)}s`} repeatCount="indefinite" />
          )}
        </circle>
      ))}
      {clima === 'nevoa' && (<>
        <defs>
          <linearGradient id="avst5nevoa" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#aeb6c9" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#aeb6c9" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#aeb6c9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#avst5nevoa)">
          {!movReduzido && (
            <animate attributeName="opacity" values="0.85;1;0.85" dur="7s" repeatCount="indefinite" />
          )}
        </rect>
      </>)}
    </svg>
  );
}
