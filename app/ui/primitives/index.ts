// Migrado para TypeScript: 2026-02-25
// App UI: Primitives
// Funções para criar elementos UI básicos
// Versão: 1.0.0-ENTERPRISE

// --- Interfaces ---

interface ElementAttributes {
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  dataset?: Record<string, string>;
  [key: string]: unknown;
}

interface ButtonOptions {
  variant?: string;
  size?: string;
  icon?: string | null;
  disabled?: boolean;
}

interface InputOptions {
  placeholder?: string;
  value?: string;
  required?: boolean;
  className?: string;
}

interface CardOptions {
  className?: string;
  header?: string | Node | null;
  body?: string | Node | Node[] | null;
  footer?: string | Node | null;
}

type ChildNode = string | Node;

// Criar elemento com atributos
export function createElement(tag: string, attrs: ElementAttributes = {}, children: ChildNode[] = []): HTMLElement {
  const el = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value as string;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.entries(value as Record<string, string>).forEach(([k, v]) => el.dataset[k] = v);
    } else {
      el.setAttribute(key, value as string);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

// Criar ícone (Lucide-style)
export function createIcon(name: string, size: number = 16, className: string = ''): HTMLElement {
  return createElement('i', {
    className: `icon icon-${name} ${className}`.trim(),
    'aria-hidden': 'true',
    style: { width: `${size}px`, height: `${size}px` }
  });
}

// Criar botão
export function createButton(text: string, onClick: EventListener, options: ButtonOptions = {}): HTMLElement {
  const { variant = 'primary', size = 'md', icon = null, disabled = false } = options;

  const children: ChildNode[] = [];
  if (icon) children.push(createIcon(icon));
  if (text) children.push(text);

  return createElement('button', {
    className: `btn btn--${variant} btn--${size}`,
    type: 'button',
    disabled: disabled ? 'disabled' : null,
    onClick
  }, children);
}

// Criar input
export function createInput(type: string, name: string, options: InputOptions = {}): HTMLElement {
  const { placeholder = '', value = '', required = false, className = '' } = options;

  return createElement('input', {
    type,
    name,
    id: name,
    placeholder,
    value,
    required: required ? 'required' : null,
    className: `input ${className}`.trim()
  });
}

// Criar label
export function createLabel(forId: string, text: string, required: boolean = false): HTMLElement {
  const children: ChildNode[] = [text];
  if (required) {
    children.push(createElement('span', { className: 'label__required' }, ['*']));
  }
  return createElement('label', { for: forId, className: 'label' }, children);
}

// Criar spinner/loader
export function createSpinner(size: string = 'md'): HTMLElement {
  return createElement('div', {
    className: `spinner spinner--${size}`,
    role: 'status',
    'aria-label': 'Carregando...'
  });
}

// Criar badge
export function createBadge(text: string, variant: string = 'default'): HTMLElement {
  return createElement('span', {
    className: `badge badge--${variant}`
  }, [text]);
}

// Criar card container
export function createCard(options: CardOptions = {}): HTMLElement {
  const { className = '', header = null, body = null, footer = null } = options;

  const children: HTMLElement[] = [];
  if (header) {
    children.push(createElement('div', { className: 'card__header' },
      typeof header === 'string' ? [header] : [header]));
  }
  if (body) {
    children.push(createElement('div', { className: 'card__body' },
      typeof body === 'string' ? [body] : Array.isArray(body) ? body : [body]));
  }
  if (footer) {
    children.push(createElement('div', { className: 'card__footer' },
      typeof footer === 'string' ? [footer] : [footer]));
  }

  return createElement('div', { className: `card ${className}`.trim() }, children);
}

// Criar divisor
export function createDivider(vertical: boolean = false): HTMLElement {
  return createElement('hr', {
    className: `divider ${vertical ? 'divider--vertical' : ''}`.trim()
  });
}

// Criar texto
export function createText(text: string, tag: string = 'span', className: string = ''): HTMLElement {
  return createElement(tag, { className }, [text]);
}

export default {
  createElement, createIcon, createButton, createInput,
  createLabel, createSpinner, createBadge, createCard,
  createDivider, createText
};
