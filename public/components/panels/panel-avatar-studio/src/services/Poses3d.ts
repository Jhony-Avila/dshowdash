// services/Poses3d.ts — POSE MANAGER do palco 3D (mega 80 · §442–§443).
// @version 1.0.0  @created 2026-08-04
//
// Uma pose = clipe + tempo exato (capturada no scrub §444). Molde
// Cenas3d: storage versionado, limite, sanitização, fail-safe.

export const CHAVE_POSES = 'dshow.avst5.p3d.poses.v1';
const LIMITE = 8;

export interface Pose3d {
  id: string;
  nome: string;
  personagem: string;   // slug — pose só vale p/ quem tem o clipe
  clipe: string;
  tempo: number;        // segundos dentro do clipe
  /** mega 335 (§443 v2, flag as5.palco3d_cine): thumb 96px ao salvar */
  thumb?: string;
}

function sanitizar(bruto: unknown): Pose3d | null {
  if (!bruto || typeof bruto !== 'object') return null;
  const p = bruto as Record<string, unknown>;
  if (typeof p.id !== 'string' || typeof p.clipe !== 'string' || !p.clipe) return null;
  return {
    id: p.id.slice(0, 40),
    nome: (typeof p.nome === 'string' && p.nome.trim() ? p.nome.trim() : 'Pose').slice(0, 24),
    personagem: typeof p.personagem === 'string' ? p.personagem.slice(0, 64) : '',
    clipe: p.clipe.slice(0, 48),
    tempo: typeof p.tempo === 'number' && Number.isFinite(p.tempo) ? Math.max(0, Math.min(600, p.tempo)) : 0,
    ...(typeof p.thumb === 'string' && p.thumb.startsWith('data:image/') && p.thumb.length < 40000
      ? { thumb: p.thumb } : {}),
  };
}

function lerTudo(): Pose3d[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_POSES) ?? '[]');
    return Array.isArray(bruto) ? bruto.map(sanitizar).filter((p): p is Pose3d => p !== null) : [];
  } catch { return []; }
}

function gravar(lista: Pose3d[]): void {
  try { localStorage.setItem(CHAVE_POSES, JSON.stringify(lista.slice(0, LIMITE))); } catch { /* cheio */ }
}

export function listarPoses(personagem?: string): Pose3d[] {
  const todas = lerTudo();
  return personagem ? todas.filter((p) => p.personagem === personagem) : todas;
}

export function salvarPose(personagem: string, clipe: string, tempo: number, thumb?: string): Pose3d | null {
  const atuais = lerTudo();
  if (atuais.length >= LIMITE) return null;
  const pose: Pose3d = {
    id: `ps_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    nome: `Pose ${atuais.length + 1}`,
    personagem, clipe,
    tempo: Math.max(0, tempo),
    ...(thumb && thumb.startsWith('data:image/') && thumb.length < 40000 ? { thumb } : {}),
  };
  gravar([...atuais, pose]);
  return pose;
}

export function excluirPose(id: string): void {
  gravar(lerTudo().filter((p) => p.id !== id));
}
