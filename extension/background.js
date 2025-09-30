importScripts('shared.js');

function updateBadge() {
    if (!chrome?.storage?.local) {
        return;
    }
    chrome.storage.local.get(MementoShared.STORAGE_KEY, (result) => {
        if (chrome.runtime?.lastError) {
            chrome.action.setBadgeText({ text: '' });
            return;
        }
        const data = result[MementoShared.STORAGE_KEY];
        const summary = MementoShared.computeSummary(data);
        if (!summary || !summary.productiveWeeks) {
            chrome.action.setBadgeText({ text: '' });
            return;
        }
        const text = `${Math.max(summary.productiveWeeks, 0)}`;
        chrome.action.setBadgeBackgroundColor({ color: '#0054FF' });
        chrome.action.setBadgeText({ text });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    updateBadge();
    chrome.alarms.create('mementoBadgeRefresh', { periodInMinutes: 60 });
});

chrome.runtime.onStartup.addListener(() => {
    updateBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[MementoShared.STORAGE_KEY]) {
        updateBadge();
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'mementoBadgeRefresh') {
        updateBadge();
    }
});
