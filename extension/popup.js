(function () {
    const snapshotEl = document.getElementById('snapshot');

    function renderReminder(message) {
        snapshotEl.innerHTML = `<div class="setup-reminder">${message}</div>`;
    }

    function renderSummary(summary) {
        const productiveDays = MementoShared.formatNumber(summary.productiveDays);
        const productiveWeeks = MementoShared.formatNumber(summary.productiveWeeks);
        const productiveYears = MementoShared.formatNumber(summary.productiveYears);
        const caption = summary.hasExcluded ? 'productive time' : 'time remaining';

        snapshotEl.innerHTML = `
            <div>
                <div class="label">${caption}</div>
                <div class="big-number">${productiveDays} days</div>
            </div>
            <div class="secondary">≈ ${productiveWeeks} weeks · ${productiveYears} years</div>
            <div class="secondary">Open a new tab to explore the full dashboard.</div>
        `;
    }

    function load() {
        if (!chrome?.storage?.local) {
            renderReminder('Extension storage unavailable.');
            return;
        }
        chrome.storage.local.get(MementoShared.STORAGE_KEY, (result) => {
            if (chrome.runtime?.lastError) {
                renderReminder('Unable to load data.');
                return;
            }
            const data = result[MementoShared.STORAGE_KEY];
            const summary = MementoShared.computeSummary(data);
            if (!summary) {
                renderReminder('Open a new tab and finish setup to see your timeline.');
                return;
            }
            renderSummary(summary);
        });
    }

    document.addEventListener('DOMContentLoaded', load);
})();
