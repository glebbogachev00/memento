// Constants
const STORAGE_KEY = 'mm-min-v1';
const DEFAULT_BIRTHDATE = '1990-01-01';
const DEFAULT_LIFE_EXPECTANCY = 80;

// Default conditions with their default values
const DEFAULT_CONDITIONS = [
    { id: 'sleep', name: 'Sleep', hours: 8, enabled: true, excluded: false, removable: false },
    { id: 'work', name: 'Work', hours: 8, enabled: false, excluded: false, removable: true },
    { id: 'screentime', name: 'Screen Time', hours: 6, enabled: false, excluded: false, removable: true },
    { id: 'mealprep', name: 'Meal Prep', hours: 1.5, enabled: false, excluded: false, removable: true },
    { id: 'commute', name: 'Commuting', hours: 1, enabled: false, excluded: false, removable: true },
    { id: 'exercise', name: 'Exercise', hours: 1, enabled: false, excluded: false, removable: true }
];

// State
let state = {
    birthdate: null,
    lifeExpectancyYears: null,
    conditions: [...DEFAULT_CONDITIONS], // Deep copy of default conditions
    currentView: 'setup',
    currentUnit: 'days',
    countdownUnit: 'days',
    isSetup: false
};

// Utility functions
function parseDate(dateString) {
    return new Date(dateString + 'T00:00:00');
}

function getWeeksDifference(startDate, endDate) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor((endDate - startDate) / msPerWeek);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(Math.max(0, num));
}

// Helper function to calculate conditions ratio
function getConditionsRatio() {
    // Calculate total hours of enabled AND excluded conditions
    const excludedConditions = state.conditions.filter(condition => condition.enabled && condition.excluded);
    const totalExcludedHours = excludedConditions.reduce((total, condition) => total + condition.hours, 0);
    
    // Return ratio of productive time (24 hours minus excluded condition hours)
    const productiveHours = Math.max(0, 24 - totalExcludedHours);
    return productiveHours / 24;
}

// Helper function to check if any conditions are excluded
function hasExcludedConditions() {
    return state.conditions.some(condition => condition.enabled && condition.excluded);
}

// State computation
function computeState() {
    const now = new Date();
    const birthDate = parseDate(state.birthdate);
    const deathDate = new Date(birthDate);
    deathDate.setFullYear(birthDate.getFullYear() + state.lifeExpectancyYears);

    const totalWeeks = getWeeksDifference(birthDate, deathDate);
    const livedWeeks = getWeeksDifference(birthDate, now);

    const livedMs = Math.max(now - birthDate, 0);
    const rawRemainingMs = Math.max(deathDate - now, 0);

    const hasExcluded = hasExcludedConditions();
    const conditionsRatio = hasExcluded ? getConditionsRatio() : 1;
    const effectiveRemainingMs = rawRemainingMs * conditionsRatio;

    const rawRemainingDays = Math.floor(rawRemainingMs / (24 * 60 * 60 * 1000));
    const rawRemainingWeeks = Math.floor(rawRemainingDays / 7);
    const rawRemainingMonths = Math.floor(rawRemainingDays / 30.44);
    const rawRemainingYears = Math.floor(rawRemainingDays / 365.25);

    const effectiveRemainingSeconds = Math.floor(effectiveRemainingMs / 1000);
    const effectiveRemainingHours = Math.floor(effectiveRemainingMs / (60 * 60 * 1000));
    const effectiveRemainingDays = Math.floor(effectiveRemainingMs / (24 * 60 * 60 * 1000));
    const effectiveRemainingWeeks = Math.floor(effectiveRemainingDays / 7);
    const effectiveRemainingMonths = Math.floor(effectiveRemainingDays / 30.44);
    const effectiveRemainingYears = Math.floor(effectiveRemainingDays / 365.25);

    return {
        totalWeeks,
        livedWeeks,
        rawRemainingMs,
        rawRemainingDays,
        rawRemainingWeeks,
        rawRemainingMonths,
        rawRemainingYears,
        effectiveRemainingMs,
        effectiveRemainingSeconds,
        effectiveRemainingHours,
        effectiveRemainingDays,
        effectiveRemainingWeeks,
        effectiveRemainingMonths,
        effectiveRemainingYears,
        deathDate,
        currentWeek: livedWeeks,
        livedMs,
        conditionsRatio,
        hasExcludedConditions: hasExcluded
    };
}

// LocalStorage functions
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.birthdate && parsed.lifeExpectancyYears) {
                state.birthdate = parsed.birthdate;
                state.lifeExpectancyYears = parsed.lifeExpectancyYears;
                
                // Migration: Handle old sleepHours format
                if (parsed.sleepHours && !parsed.conditions) {
                    // Migrate from old format
                    state.conditions = [...DEFAULT_CONDITIONS];
                    const sleepCondition = state.conditions.find(c => c.id === 'sleep');
                    if (sleepCondition) {
                        sleepCondition.hours = parsed.sleepHours;
                    }
                    // Convert old excludeSleep to individual sleep exclusion
                    if (parsed.excludeSleep && sleepCondition) {
                        sleepCondition.excluded = true;
                    }
                } else if (parsed.conditions) {
                    // New format - ensure all conditions have excluded property
                    state.conditions = parsed.conditions.map(condition => ({
                        ...condition,
                        excluded: condition.excluded || false
                    }));
                } else {
                    // Default values
                    state.conditions = [...DEFAULT_CONDITIONS];
                }
                
                state.isSetup = true;
                state.currentView = 'main';
            }
        }
    } catch (e) {
        console.error('Failed to load state:', e);
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            birthdate: state.birthdate,
            lifeExpectancyYears: state.lifeExpectancyYears,
            conditions: state.conditions,
            excludeConditions: state.excludeConditions
        }));
    } catch (e) {
        console.error('Failed to save state:', e);
    }
}

// View renderers
function renderSetupView() {
    return `
        <div class="setup-view">
            <h1 class="setup-title">Memento</h1>
            <p class="setup-subtitle">Visualize your life timeline and see how many weeks you have left</p>
            <form class="setup-form" id="setupForm">
                <div class="input-group">
                    <label class="input-label" for="setupBirthdate">Your birthdate</label>
                    <input type="date" id="setupBirthdate" class="input-field" required>
                </div>
                <div class="input-group">
                    <label class="input-label" for="setupLifeExpectancy">Expected lifespan (years)</label>
                    <input type="number" id="setupLifeExpectancy" class="input-field" min="1" max="120" value="80" required>
                </div>
                <button type="submit" class="submit-btn">Calculate My Timeline</button>
            </form>
        </div>
    `;
}

function renderMainView() {
    const computed = computeState();
    const hasExcluded = computed.hasExcludedConditions;

    const values = {
        hours: computed.effectiveRemainingHours,
        days: computed.effectiveRemainingDays,
        weeks: computed.effectiveRemainingWeeks,
        months: computed.effectiveRemainingMonths,
        years: computed.effectiveRemainingYears
    };

    const unitNames = {
        hours: 'Hours',
        days: 'Days', 
        weeks: 'Weeks',
        months: 'Months',
        years: 'Years'
    };
    
    const totalEffectiveMs = computed.livedMs + computed.effectiveRemainingMs;
    const progressPercentage = totalEffectiveMs > 0
        ? ((computed.livedMs / totalEffectiveMs) * 100).toFixed(1)
        : '0.0';
    
    const currentValue = values[state.currentUnit] ?? 0;
    const formattedValue = formatNumber(currentValue);
    console.log('Rendering main view:', {
        currentUnit: state.currentUnit,
        currentValue: currentValue,
        formattedValue: formattedValue,
        allValues: values,
        progressPercentage,
        hasExcluded,
        conditionsRatio: computed.conditionsRatio
    });
    
    return `
        <div class="one-number-view">
            <div class="big-number">${formattedValue}</div>
            <div class="unit-toggles">
                <button class="unit-btn ${state.currentUnit === 'hours' ? 'active' : ''}" data-unit="hours">Hours</button>
                <button class="unit-btn ${state.currentUnit === 'days' ? 'active' : ''}" data-unit="days">Days</button>
                <button class="unit-btn ${state.currentUnit === 'weeks' ? 'active' : ''}" data-unit="weeks">Weeks</button>
                <button class="unit-btn ${state.currentUnit === 'months' ? 'active' : ''}" data-unit="months">Months</button>
                <button class="unit-btn ${state.currentUnit === 'years' ? 'active' : ''}" data-unit="years">Years</button>
            </div>
            <div class="caption">${unitNames[state.currentUnit]} remaining${hasExcluded ? ' (productive time)' : ''}</div>
            
            <div class="visualization">
                <div class="viz-title">Life Progress</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-labels">
                    <span>Birth</span>
                    <span>${progressPercentage}% complete</span>
                    <span>Age ${state.lifeExpectancyYears}</span>
                </div>
            </div>
        </div>
    `;
}

function renderQuietGridView() {
    console.log('renderQuietGridView called');
    const computed = computeState();
    console.log('Computed state:', computed);
    
    // Grid should show actual life weeks - total and lived stay the same
    // Only the remaining weeks display changes when conditions are excluded
    const hasExcluded = computed.hasExcludedConditions;
    const effectiveLivedWeeks = computed.livedWeeks;
    const displayRemainingWeeks = hasExcluded ? computed.effectiveRemainingWeeks : computed.rawRemainingWeeks;
    const displayTotalWeeks = hasExcluded
        ? computed.livedWeeks + computed.effectiveRemainingWeeks
        : computed.totalWeeks;

    const totalSquares = Math.max(displayTotalWeeks, effectiveLivedWeeks || 0);
    const currentWeek = totalSquares > 0 ? Math.min(effectiveLivedWeeks, totalSquares - 1) : 0;

    let gridHtml = '';
    for (let i = 0; i < totalSquares; i++) {
        const isLived = i < effectiveLivedWeeks;
        const isCurrent = i === currentWeek;
        
        let classes = 'week-square';
        if (isLived) classes += ' lived';
        if (isCurrent) classes += ' current';
        
        gridHtml += `<div class="${classes}"></div>`;
    }
    
    const gridTitle = hasExcluded ? 'Your Productive Life in Weeks' : 'Your Life in Weeks';
    
    const result = `
        <div class="quiet-grid-view">
            <div class="grid-title">${gridTitle}</div>
            <div class="weeks-grid">${gridHtml}</div>
            <div class="grid-stats">
                <div class="stat-item">
                    <span class="stat-number">${formatNumber(effectiveLivedWeeks)}</span>
                    <span class="stat-label">Lived</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${formatNumber(displayRemainingWeeks)}</span>
                    <span class="stat-label">Remaining${hasExcluded ? ' (productive)' : ''}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${formatNumber(displayTotalWeeks)}</span>
                    <span class="stat-label">Total${hasExcluded ? ' (productive)' : ''}</span>
                </div>
            </div>
        </div>
    `;
    
    console.log('Grid view HTML generated with stats:', {
        lived: effectiveLivedWeeks,
        remaining: displayRemainingWeeks, 
        total: displayTotalWeeks,
        hasExcluded
    });
    
    return result;
}

function renderCountdownView() {
    const computed = computeState();
    
    // Convert remaining milliseconds to time components
    const totalSeconds = Math.floor(computed.effectiveRemainingMs / 1000);
    const years = Math.floor(totalSeconds / (365.25 * 24 * 60 * 60));
    const months = Math.floor((totalSeconds % (365.25 * 24 * 60 * 60)) / (30.44 * 24 * 60 * 60));
    const days = Math.floor((totalSeconds % (30.44 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    const conditionsNote = computed.hasExcludedConditions ? `Productive time only` : '';
    const countdownSubtitleClass = `countdown-subtitle${conditionsNote ? '' : ' hidden'}`;
    
    return `
        <div class="countdown-view">
            <div class="countdown-title">Time Remaining</div>
            <div class="${countdownSubtitleClass}">${conditionsNote}</div>
            
            <div class="countdown-clock">
                <div class="countdown-unit">
                    <div class="countdown-number" id="years">${years}</div>
                    <div class="countdown-label">Years</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number" id="months">${months.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">Months</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number" id="days">${days.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">Days</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number" id="hours">${hours.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">Hours</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number" id="minutes">${minutes.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">Minutes</div>
                </div>
                <div class="countdown-separator">:</div>
                <div class="countdown-unit">
                    <div class="countdown-number" id="seconds">${seconds.toString().padStart(2, '0')}</div>
                    <div class="countdown-label">Seconds</div>
                </div>
            </div>
        </div>
    `;
}

// Render function
function render() {
    console.log('Render function called, current view:', state.currentView);
    console.log('Current conditions state:', state.conditions);
    
    const mainContent = document.getElementById('mainContent');
    const header = document.getElementById('mainHeader');
    let html = '';
    
    // Show/hide header based on setup state
    if (state.isSetup) {
        header.classList.remove('hidden');
    } else {
        header.classList.add('hidden');
    }
    
    switch (state.currentView) {
        case 'setup':
            html = renderSetupView();
            break;
        case 'main':
            html = renderMainView();
            break;
        case 'grid':
            html = renderQuietGridView();
            break;
        case 'countdown':
            html = renderCountdownView();
            break;
    }

    console.log('Setting HTML content, length:', html.length);
    mainContent.classList.toggle('grid-mode', state.currentView === 'grid');
    mainContent.innerHTML = html;
    console.log('HTML content set, new mainContent innerHTML length:', mainContent.innerHTML.length);
    
    // Add event listeners for setup form
    if (state.currentView === 'setup') {
        document.getElementById('setupForm').addEventListener('submit', handleSetupSubmit);
    }
    
    // Add event listeners for unit toggles
    if (state.currentView === 'main') {
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                state.currentUnit = e.target.dataset.unit;
                render();
            });
        });
    }
    
    // Add event listeners for countdown - no unit toggles needed for live countdown
    
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === state.currentView) {
            link.classList.add('active');
        }
    });
    
    // Render conditions toggles
    renderConditionsToggles();
    
    // Start countdown timer if on countdown view
    if (state.currentView === 'countdown') {
        startCountdownTimer();
    } else {
        stopCountdownTimer();
    }
}

// Conditions toggles functions
function renderConditionsToggles() {
    const conditionsToggles = document.getElementById('conditionsToggles');
    if (!conditionsToggles) return;
    
    // Get enabled conditions
    const enabledConditions = state.conditions.filter(c => c.enabled);
    
    if (enabledConditions.length === 0) {
        conditionsToggles.innerHTML = '';
        return;
    }
    
    conditionsToggles.innerHTML = enabledConditions.map(condition => `
        <button class="condition-toggle-btn ${condition.excluded ? 'excluded' : ''}" 
                data-condition-id="${condition.id}">
            ${condition.name}
            <span class="condition-hours">${condition.hours}h</span>
        </button>
    `).join('');
}

// Countdown timer functions
let countdownInterval = null;
let countdownRemainingMs = 0;
let countdownLastTick = null;
let countdownHasExcluded = false;

function startCountdownTimer() {
    stopCountdownTimer(); // Clear any existing timer
    
    const computed = computeState();
    countdownRemainingMs = computed.effectiveRemainingMs;
    countdownHasExcluded = computed.hasExcludedConditions;
    countdownLastTick = Date.now();

    updateCountdownDisplay();
    countdownInterval = setInterval(tickCountdownTimer, 1000);
}

function stopCountdownTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownLastTick = null;
}

function tickCountdownTimer() {
    if (!countdownLastTick) {
        countdownLastTick = Date.now();
    }

    const now = Date.now();
    const elapsed = now - countdownLastTick;
    countdownLastTick = now;

    countdownRemainingMs = Math.max(countdownRemainingMs - elapsed, 0);
    updateCountdownDisplay();

    if (countdownRemainingMs <= 0) {
        stopCountdownTimer();
    }
}

function updateCountdownDisplay() {
    if (state.currentView !== 'countdown') {
        stopCountdownTimer();
        return;
    }
    
    const totalSeconds = Math.floor(countdownRemainingMs / 1000);
    
    const years = Math.floor(totalSeconds / (365.25 * 24 * 60 * 60));
    const months = Math.floor((totalSeconds % (365.25 * 24 * 60 * 60)) / (30.44 * 24 * 60 * 60));
    const days = Math.floor((totalSeconds % (30.44 * 24 * 60 * 60)) / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    const subtitleEl = document.querySelector('.countdown-subtitle');
    if (subtitleEl) {
        if (countdownHasExcluded) {
            subtitleEl.textContent = 'Productive time only';
            subtitleEl.classList.remove('hidden');
        } else {
            subtitleEl.textContent = '';
            subtitleEl.classList.add('hidden');
        }
    }
    
    // Update only if elements exist
    const yearsEl = document.getElementById('years');
    const monthsEl = document.getElementById('months');
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (yearsEl) yearsEl.textContent = years;
    if (monthsEl) monthsEl.textContent = months.toString().padStart(2, '0');
    if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
    if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
    if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
    if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
}

// Setup form handler
function handleSetupSubmit(e) {
    e.preventDefault();
    
    const birthdate = document.getElementById('setupBirthdate').value;
    const lifeExpectancy = parseInt(document.getElementById('setupLifeExpectancy').value);
    
    if (birthdate && lifeExpectancy >= 1 && lifeExpectancy <= 120) {
        state.birthdate = birthdate;
        state.lifeExpectancyYears = lifeExpectancy;
        
        state.isSetup = true;
        state.currentView = 'main';
        saveState();
        window.location.hash = '#main';
        render();
    }
}

// Router
function handleHashChange() {
    if (!state.isSetup) {
        state.currentView = 'setup';
        return render();
    }
    
    const hash = window.location.hash.slice(1);
    if (['main', 'grid', 'countdown'].includes(hash)) {
        state.currentView = hash;
    } else {
        state.currentView = 'main';
        window.location.hash = '#main';
    }
    render();
}

// Modal functions
function openModal() {
    const modal = document.getElementById('modal');
    const birthdateInput = document.getElementById('birthdate');
    const lifeExpectancyInput = document.getElementById('lifeExpectancy');
    
    birthdateInput.value = state.birthdate;
    lifeExpectancyInput.value = state.lifeExpectancyYears;
    
    renderConditionsList();
    
    modal.classList.remove('hidden');
    birthdateInput.focus();
}

function renderConditionsList() {
    const conditionsList = document.getElementById('conditionsList');
    if (!conditionsList) return;
    
    conditionsList.innerHTML = '';
    
    state.conditions.forEach((condition, index) => {
        const conditionItem = document.createElement('div');
        conditionItem.className = `condition-item ${!condition.enabled ? 'disabled' : ''}`;
        
        conditionItem.innerHTML = `
            <input type="checkbox" 
                   class="condition-checkbox" 
                   ${condition.enabled ? 'checked' : ''} 
                   data-condition-id="${condition.id}">
            <span class="condition-name">${condition.name}</span>
            <input type="number" 
                   class="condition-hours-input" 
                   value="${condition.hours}" 
                   min="0" 
                   max="24" 
                   step="0.5"
                   data-condition-id="${condition.id}">
            <span class="condition-hours-label">hrs/day</span>
            ${condition.removable ? `<button type="button" class="condition-remove" data-condition-id="${condition.id}">×</button>` : ''}
        `;
        
        conditionsList.appendChild(conditionItem);
    });
}

function addCustomCondition() {
    const name = prompt('Enter condition name:');
    if (!name || name.trim() === '') return;
    
    const hours = parseFloat(prompt('Enter hours per day:', '1') || '1');
    if (isNaN(hours) || hours < 0 || hours > 24) return;
    
    const newCondition = {
        id: 'custom_' + Date.now(),
        name: name.trim(),
        hours: hours,
        enabled: false,
        excluded: false,
        removable: true
    };
    
    state.conditions.push(newCondition);
    renderConditionsList();
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

function saveSettings(e) {
    e.preventDefault();
    
    const birthdate = document.getElementById('birthdate').value;
    const lifeExpectancy = parseInt(document.getElementById('lifeExpectancy').value);
    
    if (birthdate && lifeExpectancy >= 1 && lifeExpectancy <= 120) {
        state.birthdate = birthdate;
        state.lifeExpectancyYears = lifeExpectancy;
        
        // Update conditions from form
        const checkboxes = document.querySelectorAll('.condition-checkbox');
        const hoursInputs = document.querySelectorAll('.condition-hours-input');
        
        checkboxes.forEach(checkbox => {
            const conditionId = checkbox.dataset.conditionId;
            const condition = state.conditions.find(c => c.id === conditionId);
            if (condition) {
                condition.enabled = checkbox.checked;
            }
        });
        
        hoursInputs.forEach(input => {
            const conditionId = input.dataset.conditionId;
            const condition = state.conditions.find(c => c.id === conditionId);
            const hours = parseFloat(input.value);
            if (condition && !isNaN(hours) && hours >= 0 && hours <= 24) {
                condition.hours = hours;
            }
        });
        
        saveState();
        closeModal();
        render();
    }
}

// Event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#' + e.target.dataset.view;
        });
    });
    
    // Hash change
    window.addEventListener('hashchange', handleHashChange);
    
    // Modal
    document.getElementById('editBtn').addEventListener('click', openModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
    
    // Conditions management
    document.addEventListener('click', (e) => {
        if (e.target.id === 'addConditionBtn') {
            addCustomCondition();
        }
        
        if (e.target.classList.contains('condition-remove')) {
            const conditionId = e.target.dataset.conditionId;
            state.conditions = state.conditions.filter(c => c.id !== conditionId);
            renderConditionsList();
        }
        
        if (e.target.classList.contains('condition-checkbox')) {
            const conditionItem = e.target.closest('.condition-item');
            if (e.target.checked) {
                conditionItem.classList.remove('disabled');
            } else {
                conditionItem.classList.add('disabled');
            }
        }
    });
    
    // Individual condition toggles (using event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('condition-toggle-btn') || e.target.closest('.condition-toggle-btn')) {
            const button = e.target.classList.contains('condition-toggle-btn') ? e.target : e.target.closest('.condition-toggle-btn');
            const conditionId = button.dataset.conditionId;
            const condition = state.conditions.find(c => c.id === conditionId);
            if (condition) {
                console.log('Toggling condition:', conditionId, 'from', condition.excluded, 'to', !condition.excluded);
                condition.excluded = !condition.excluded;
                console.log('Condition after toggle:', condition);
                saveState();
                render(); // This should trigger a full re-render including progress bar
                console.log('Render called after condition toggle');
            }
        }
    });
    
    // Close modal on background click
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            closeModal();
        }
    });
    
    // Close modal on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Initialize
function init() {
    loadState();
    setupEventListeners();
    handleHashChange();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
