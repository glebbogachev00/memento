# Memento – Life Weeks Tracker

Life Weeks visualises how many weeks you have lived, how many remain, and how everyday conditions (sleep, screen time, work, etc.) change your productive time. The app works as a website and ships with a Chrome new-tab extension so your timeline is always a tab away.

## Features
- Interactive overview with unit toggles (hours, days, weeks, months, years) and a progress bar showing life lived vs. productive time left.
- Quiet grid view that maps each week of your life, highlighting lived, current, and remaining productive weeks.
- Countdown view with a live timer that accelerates when non-productive conditions are excluded.
- Editable conditions: toggle exclusion, adjust daily hours, or add custom activities.
- Chrome extension bundle (`extension/`) that replaces the new tab page with the same interface.

## Quick Start (Website)
1. Clone or download the repository.
2. Open `index.html` in any modern browser.
3. Complete the short setup (birthdate, life expectancy, sleep hours) to unlock all views.
4. Use the **Edit** button in the header to manage life conditions.

## Chrome Extension
1. Open Chrome (or Edge) and visit `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose the `extension/` directory.
4. Open a new tab to see the Memento dashboard.

### Packaging
- The extension is Manifest V3 compliant and overrides the new tab page.
- Replace the placeholder icons in `extension/icons/` with final artwork before publishing.
- When you update the main site files, mirror the changes into `extension/` (or add a build script to sync them automatically).

## Development Notes
- State persists via `localStorage`. When running inside the extension, Chrome maps this to extension storage.
- External fonts (Geist Mono via Google Fonts) load over HTTPS; optionally self-host for stricter extension CSPs.
- No build tooling is required—everything is plain HTML/CSS/JS. If you prefer a bundler, ensure you update import paths for both the site and the extension.

## Roadmap Ideas
- Toolbar popup or badge showing remaining productive days.
- Content script reminders on distracting sites.
- Scheduled notifications using `chrome.alarms`.
- Sync settings to multiple devices via `chrome.storage.sync`.

Enjoy staying mindful of your time with Memento!
