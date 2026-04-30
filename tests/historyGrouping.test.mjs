import assert from 'node:assert/strict';
import {
  buildHistorySections,
  createDefaultExpandedGroupIds,
  tabMatchesSearch,
} from '../services/historyGrouping.js';

const baseBrowserState = { url: '', history: [], currentIndex: -1, isOpen: false, key: 0 };

const tab = (id, title, createdAt, content, groupId) => ({
  id,
  title,
  createdAt,
  groupId,
  browserState: baseBrowserState,
  messages: [{ id: `${id}-m`, role: 'user', content, timestamp: createdAt }],
});

const groups = [
  { id: 'work', name: 'Work', createdAt: 1 },
  { id: 'home', name: 'Home', createdAt: 2 },
];

const tabs = [
  tab('old', 'Older work item', 100, 'budget notes', 'work'),
  tab('new', 'Newer work item', 300, 'release plan', 'work'),
  tab('home-1', 'Recipe', 200, 'dinner plan', 'home'),
  tab('stale', 'Stale group', 400, 'orphaned conversation', 'missing'),
  tab('loose', 'Loose thread', 250, 'ungrouped notes'),
];

{
  const view = buildHistorySections(tabs, groups, '');
  assert.deepEqual(view.sections.map((section) => section.id), ['work', 'home']);
  assert.deepEqual(view.sections[0].tabs.map((item) => item.id), ['new', 'old']);
  assert.deepEqual(view.ungrouped.map((item) => item.id), ['stale', 'loose']);
  assert.equal(view.totalCount, 5);
}

{
  const view = buildHistorySections(tabs, groups, 'release');
  assert.deepEqual(view.sections.map((section) => section.id), ['work']);
  assert.deepEqual(view.sections[0].tabs.map((item) => item.id), ['new']);
  assert.deepEqual(view.ungrouped, []);
  assert.equal(view.hasQuery, true);
}

assert.equal(tabMatchesSearch(tabs[2], 'dinner'), true);
assert.equal(tabMatchesSearch(tabs[2], 'missing'), false);
assert.deepEqual([...createDefaultExpandedGroupIds(groups, '')], ['work', 'home']);
