// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: infinite-scroll
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   initInfiniteScroll() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'scroll'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-01.ui.infinite-scroll';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Infinite Scroll Handler
 * @module panel-01/ui/infinite-scroll
 * @version 1.1.0-AAA
 */

export function initInfiniteScroll(container: HTMLElement, { onLoadMore, threshold = 100 }: { onLoadMore: () => Promise<unknown>; threshold?: number }) {
    if (!container) return null;
    
    let loading = false;
    let hasMore = true;
    
    const handleScroll = () => {
        if (loading || !hasMore) return;
        
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < threshold) {
            loading = true;
            onLoadMore().then((moreData: unknown) => {
                loading = false;
                if (!moreData) hasMore = false;
            }).catch(() => {
                loading = false;
            });
        }
    };
    
    container.addEventListener('scroll', handleScroll);
    
    return {
        destroy() {
            container.removeEventListener('scroll', handleScroll);
        },
        reset() {
            hasMore = true;
            loading = false;
        }
    };
}

export default { initInfiniteScroll };
