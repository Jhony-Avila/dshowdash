// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-avatar
// PURPOSE: Container Avatar Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   AVATAR_SIZE — exported value
//   AVATAR_STATUS — exported value
//   createAvatar() — exported function
//   createAvatarGroup() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-avatar';

export const AVATAR_SIZE = { XS: 'xs', SM: 'sm', MD: 'md', LG: 'lg', XL: 'xl' };
export const AVATAR_STATUS = { ONLINE: 'online', OFFLINE: 'offline', BUSY: 'busy', AWAY: 'away' };

function _getInitials(name: string) {
  if (!name) return '?';
  return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
}

function _getColorFromName(name: string) {
  if (!name) return '#6b7280';
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
  return colors[Math.abs(hash) % colors.length];
}

export function createAvatar(options: Record<string, unknown> = {}) {
  const {
    name = '',
    src = null,
    size = AVATAR_SIZE.MD,
    status = null,
    rounded = true,
    className = '',
    onClick
  } = options;

  const avatar = document.createElement('div');
  avatar.className = `dsd-avatar dsd-avatar--${size} ${rounded ? 'dsd-avatar--rounded' : ''} ${className}`.trim();
  avatar.setAttribute('role', 'img');
  avatar.setAttribute('aria-label', String(name || 'Avatar'));

  function _createImg(imgSrc: string) {
    const img = document.createElement('img');
    img.className = 'dsd-avatar__image';
    img.setAttribute('src', imgSrc);
    img.setAttribute('alt', String(name));
    img.loading = 'lazy';
    return img;
  }

  if (src) {
    const img = _createImg(src as string);
    img.onerror = () => {
      img.remove();
      _renderFallback();
    };
    avatar.appendChild(img);
  } else {
    _renderFallback();
  }

  function _renderFallback() {
    const initials = _getInitials(name as string);
    const bgColor = _getColorFromName(name as string);
    avatar.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'dsd-avatar__initials';
    span.style.backgroundColor = bgColor;
    span.textContent = initials;
    avatar.appendChild(span);
  }
  
  if (status) {
    const statusEl = document.createElement('span');
    statusEl.className = `dsd-avatar__status dsd-avatar__status--${status}`;
    avatar.appendChild(statusEl);
  }
  
  if (onClick) {
    avatar.style.cursor = 'pointer';
    avatar.addEventListener('click', onClick as EventListener);
  }
  
  return {
    element: avatar,
    setImage(newSrc: string) { avatar.innerHTML = ''; avatar.appendChild(_createImg(newSrc)); return this; },
    setStatus(newStatus: unknown) {
      avatar.querySelector('.dsd-avatar__status')?.remove();
      if (newStatus) {
        const statusEl = document.createElement('span');
        statusEl.className = `dsd-avatar__status dsd-avatar__status--${newStatus}`;
        avatar.appendChild(statusEl);
      }
      return this;
    },
    getElement() { return avatar; }
  };
}

export function createAvatarGroup(avatars: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  const { max = 5, size = AVATAR_SIZE.MD } = options;
  
  const group = document.createElement('div');
  group.className = 'dsd-avatar-group';
  
  const displayAvatars = avatars.slice(0, Number(max));
  const remaining = avatars.length - Number(max);
  
  displayAvatars.forEach((avatarOpts: Record<string, unknown>) => {
    const av = createAvatar({ ...avatarOpts, size });
    group.appendChild(av.element);
  });
  
  if (remaining > 0) {
    const moreEl = document.createElement('div');
    moreEl.className = `dsd-avatar dsd-avatar--${size} dsd-avatar--rounded dsd-avatar--more`;
    moreEl.innerHTML = `<span class="dsd-avatar__initials">+${remaining}</span>`;
    group.appendChild(moreEl);
  }
  
  return group;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID }; }

export default { createAvatar, createAvatarGroup, info, healthCheck, VERSION, MODULE_ID, AVATAR_SIZE, AVATAR_STATUS };
