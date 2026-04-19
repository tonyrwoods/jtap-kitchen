// Store scroll position and navigation state for each tab
const tabStateMap = new Map();

export const saveTabState = (tabId, scrollPosition, pathname = null) => {
  if (!tabStateMap.has(tabId)) {
    tabStateMap.set(tabId, {});
  }
  const state = tabStateMap.get(tabId);
  state.scrollPosition = scrollPosition;
  if (pathname) {
    state.pathname = pathname;
  }
};

export const loadTabState = (tabId) => {
  return tabStateMap.get(tabId) || { scrollPosition: 0, pathname: null };
};

export const clearTabState = (tabId) => {
  tabStateMap.delete(tabId);
};

export const clearAllTabState = () => {
  tabStateMap.clear();
};

export const getTabStateSnapshot = () => {
  return Object.fromEntries(tabStateMap);
};