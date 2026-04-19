// Store scroll position and navigation state for each tab
const tabStateMap = new Map();

export const saveTabState = (tabId, scrollPosition) => {
  if (!tabStateMap.has(tabId)) {
    tabStateMap.set(tabId, {});
  }
  const state = tabStateMap.get(tabId);
  state.scrollPosition = scrollPosition;
};

export const loadTabState = (tabId) => {
  return tabStateMap.get(tabId) || { scrollPosition: 0 };
};

export const clearTabState = (tabId) => {
  tabStateMap.delete(tabId);
};

export const clearAllTabState = () => {
  tabStateMap.clear();
};