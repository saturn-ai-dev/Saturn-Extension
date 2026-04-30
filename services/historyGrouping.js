const normalizeSearch = (value) => String(value ?? '').trim().toLowerCase();

const getMessageContent = (message) => String(message?.content ?? message?.text ?? '');

export function tabMatchesSearch(tab, searchTerm) {
  const query = normalizeSearch(searchTerm);
  if (!query) return true;

  const title = normalizeSearch(tab?.title);
  if (title.includes(query)) return true;

  const messages = Array.isArray(tab?.messages) ? tab.messages : [];
  return messages.some((message) => normalizeSearch(getMessageContent(message)).includes(query));
}

export function sortTabsNewestFirst(tabs) {
  return [...(Array.isArray(tabs) ? tabs : [])].sort(
    (a, b) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0),
  );
}

export function buildHistorySections(tabs, groups, searchTerm = '') {
  const query = normalizeSearch(searchTerm);
  const hasQuery = query.length > 0;
  const safeGroups = (Array.isArray(groups) ? groups : []).filter((group) => group?.id);
  const sections = safeGroups.map((group) => ({
    id: group.id,
    title: group.name || 'Untitled group',
    group,
    tabs: [],
  }));
  const sectionsById = new Map(sections.map((section) => [section.id, section]));
  const ungrouped = [];

  const filteredTabs = sortTabsNewestFirst(tabs).filter((tab) => tabMatchesSearch(tab, query));

  for (const tab of filteredTabs) {
    const section = tab?.groupId ? sectionsById.get(tab.groupId) : null;
    if (section) {
      section.tabs.push(tab);
    } else {
      ungrouped.push(tab);
    }
  }

  return {
    sections: hasQuery ? sections.filter((section) => section.tabs.length > 0) : sections,
    ungrouped,
    totalCount: filteredTabs.length,
    hasQuery,
  };
}

export function createDefaultExpandedGroupIds(groups) {
  return new Set((Array.isArray(groups) ? groups : []).filter((group) => group?.id).map((group) => group.id));
}
