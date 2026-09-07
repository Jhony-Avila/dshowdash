// vc/LimiteVC.tsx — error boundary do Visual Composer.
// No erro de init/render do VC, avisa o App (aoErro) que cai no shell clássico (fail-safe).
import { Component } from 'react';
import type { ReactNode } from 'react';

export class LimiteVC extends Component<{ aoErro: () => void; children: ReactNode }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError(): { erro: boolean } { return { erro: true }; }
  componentDidCatch(): void { this.props.aoErro(); }
  render(): ReactNode { return this.state.erro ? null : this.props.children; }
}
