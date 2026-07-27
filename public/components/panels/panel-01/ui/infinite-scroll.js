const MODULE_ID = "panel-01.ui.infinite-scroll";
const VERSION = "9.3.0-P2-ENTERPRISE";
function initInfiniteScroll(container, { onLoadMore, threshold = 100 }) {
  if (!container) return null;
  let loading = false;
  let hasMore = true;
  const handleScroll = () => {
    if (loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      loading = true;
      onLoadMore().then((moreData) => {
        loading = false;
        if (!moreData) hasMore = false;
      }).catch(() => {
        loading = false;
      });
    }
  };
  container.addEventListener("scroll", handleScroll);
  return {
    destroy() {
      container.removeEventListener("scroll", handleScroll);
    },
    reset() {
      hasMore = true;
      loading = false;
    }
  };
}
var infinite_scroll_default = { initInfiniteScroll };
export {
  MODULE_ID,
  VERSION,
  infinite_scroll_default as default,
  initInfiniteScroll
};
