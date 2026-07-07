import { useState } from 'react';
import { ProposalsApp } from './proposals/ProposalsApp';
import { AdminItemCatalog } from './AdminItemCatalog';
import { AdminCommercialTerms } from './AdminCommercialTerms';
import { AdminPaymentMethods } from './AdminPaymentMethods';
import { TemplatePreview } from './TemplatePreview';
import { TemplatesManager } from './TemplatesManager';
import { SectionsManager } from './SectionsManager';
import { FooterGlobal } from './FooterGlobal';
import { ThemeToggle } from './ThemeToggle';

// Ícones inline (SVG próprios, currentColor) — sem dependência nova de biblioteca.
function navIcon(paths: any) {
  return (
    <svg
      className="k-nav-ico"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}

const ICONS: Record<string, any> = {
  // Propostas = documento
  proposals: navIcon(
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  // Itens = lista
  items: navIcon(
    <>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </>
  ),
  // Condições = cláusula / prancheta
  terms: navIcon(
    <>
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
      <path d="M8 12h8M8 16h5" />
    </>
  ),
  // Pagamentos = cartão
  payments: navIcon(
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  // Templates = layout
  templates: navIcon(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  // Seções = blocos / camadas
  sections: navIcon(
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </>
  ),
  // Preview = olho
  preview: navIcon(
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

const NAV = [
  { key: 'proposals', label: 'Propostas' },
  { key: 'items', label: 'Itens' },
  { key: 'terms', label: 'Condições' },
  { key: 'payments', label: 'Pagamentos' },
  { key: 'templates', label: 'Templates', adminOnly: true },
  { key: 'sections', label: 'Seções', adminOnly: true },
  { key: 'preview', label: 'Preview' },
];

const COLLAPSE_KEY = 'koala.sidebar.collapsed';

export function Shell({ me }: { me: any }) {
  const [view, setView] = useState('proposals');
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const isAdmin = me.role === 'admin';
  const current = NAV.find((n) => n.key === view);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* localStorage indisponível — mantém só em memória */
      }
      return next;
    });
  }

  return (
    <div className={'k-app' + (collapsed ? ' is-collapsed' : '')}>
      <aside className="k-sidebar">
        <div className="k-side-head">
          <div className="k-brand">
            <span className="k-brand-mark">🐨</span>
            <span className="k-brand-text">Koala Docs</span>
          </div>
          <button
            type="button"
            className="k-side-toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <svg
              className="k-side-chevron"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <nav>
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => (
            <button
              key={n.key}
              className={'k-nav' + (view === n.key ? ' is-active' : '')}
              onClick={() => setView(n.key)}
              title={collapsed ? n.label : undefined}
              aria-current={view === n.key ? 'page' : undefined}
            >
              {ICONS[n.key]}
              <span className="k-nav-label">{n.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="k-main">
        <header className={'k-topbar' + (scrolled ? ' is-scrolled' : '')}>
          <div className="k-topbar-title">{current ? current.label : ''}</div>
          <div className="k-topbar-right">
            <ThemeToggle />
            <div className="k-user">
              {me.name || me.email} · <span className="k-role">{me.role}</span>
            </div>
          </div>
        </header>
        <div className="k-scroll" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}>
          <main className="k-content k-content-wide">
            {view === 'proposals' && <ProposalsApp />}
            {view === 'items' && <AdminItemCatalog canWrite={isAdmin} />}
            {view === 'terms' && <AdminCommercialTerms canWrite={isAdmin} />}
            {view === 'payments' && <AdminPaymentMethods canWrite={isAdmin} />}
            {view === 'templates' && isAdmin && <TemplatesManager />}
            {view === 'sections' && isAdmin && <SectionsManager />}
            {view === 'preview' && <TemplatePreview />}
          </main>
        </div>
      </div>

      <footer className="k-footer">
        <FooterGlobal />
      </footer>
    </div>
  );
}
