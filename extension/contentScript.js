(function () {
    const NUDGE_ID = 'memento-nudge-banner';
    const DISMISS_KEY = 'mementoNudgeDismissed';

    function alreadyDismissed() {
        try {
            return window.sessionStorage.getItem(DISMISS_KEY) === 'true';
        } catch (err) {
            return false;
        }
    }

    function markDismissed() {
        try {
            window.sessionStorage.setItem(DISMISS_KEY, 'true');
        } catch (err) {
            // ignore
        }
    }

    function removeExisting() {
        const existing = document.getElementById(NUDGE_ID);
        if (existing) {
            existing.remove();
        }
    }

    function createBanner(summary) {
        removeExisting();
        const banner = document.createElement('div');
        banner.id = NUDGE_ID;
        banner.style.position = 'fixed';
        banner.style.bottom = '24px';
        banner.style.right = '24px';
        banner.style.zIndex = '2147483647';
        banner.style.background = '#111';
        banner.style.color = '#fff';
        banner.style.padding = '16px 18px';
        banner.style.borderRadius = '10px';
        banner.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
        banner.style.fontFamily = 'Geist Mono, monospace';
        banner.style.maxWidth = '280px';
        banner.style.lineHeight = '1.4';
        banner.style.fontSize = '14px';
        banner.style.display = 'flex';
        banner.style.flexDirection = 'column';
        banner.style.gap = '8px';

        const heading = document.createElement('div');
        heading.style.fontSize = '12px';
        heading.style.textTransform = 'uppercase';
        heading.style.letterSpacing = '0.8px';
        heading.style.opacity = '0.7';
        heading.textContent = 'Memento reminder';

        const message = document.createElement('div');
        const productiveHours = MementoShared.formatNumber(summary.productiveHours);
        const productiveWeeks = MementoShared.formatNumber(summary.productiveWeeks);
        message.innerHTML = `Only <strong>${productiveHours}</strong> productive hours (~${productiveWeeks} weeks) remain. Make this session count.`;

        const dismiss = document.createElement('button');
        dismiss.textContent = 'Got it';
        dismiss.style.alignSelf = 'flex-start';
        dismiss.style.background = '#fff';
        dismiss.style.color = '#111';
        dismiss.style.border = 'none';
        dismiss.style.borderRadius = '6px';
        dismiss.style.padding = '6px 12px';
        dismiss.style.fontSize = '12px';
        dismiss.style.cursor = 'pointer';
        dismiss.style.fontFamily = 'Geist Mono, monospace';
        dismiss.addEventListener('click', () => {
            markDismissed();
            banner.remove();
        });

        banner.appendChild(heading);
        banner.appendChild(message);
        banner.appendChild(dismiss);

        document.body.appendChild(banner);
    }

    function showReminder() {
        if (alreadyDismissed()) {
            return;
        }
        if (!chrome?.storage?.local) {
            return;
        }
        chrome.storage.local.get(MementoShared.STORAGE_KEY, (result) => {
            if (chrome.runtime?.lastError) {
                return;
            }
            const data = result[MementoShared.STORAGE_KEY];
            const summary = MementoShared.computeSummary(data);
            if (!summary || summary.productiveHours <= 0) {
                return;
            }
            createBanner(summary);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showReminder);
    } else {
        showReminder();
    }
})();
