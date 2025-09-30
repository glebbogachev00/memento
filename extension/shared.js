const MementoShared = (() => {
    const STORAGE_KEY = 'mm-min-v1';

    function parseDate(dateString) {
        return new Date(`${dateString}T00:00:00`);
    }

    function getWeeksDifference(startDate, endDate) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        return Math.floor((endDate - startDate) / msPerWeek);
    }

    function getConditionsRatio(data) {
        if (!data || !Array.isArray(data.conditions)) return 1;
        const excludedConditions = data.conditions.filter(condition => condition.enabled && condition.excluded);
        const totalExcludedHours = excludedConditions.reduce((total, condition) => total + (Number(condition.hours) || 0), 0);
        const productiveHours = Math.max(0, 24 - totalExcludedHours);
        return productiveHours / 24;
    }

    function computeSummary(data) {
        if (!data || !data.birthdate || !data.lifeExpectancyYears) {
            return null;
        }

        const birthDate = parseDate(data.birthdate);
        if (Number.isNaN(birthDate.getTime())) {
            return null;
        }

        const now = new Date();
        const deathDate = new Date(birthDate);
        deathDate.setFullYear(birthDate.getFullYear() + Number(data.lifeExpectancyYears));

        const totalWeeks = getWeeksDifference(birthDate, deathDate);
        const livedWeeks = getWeeksDifference(birthDate, now);

        const rawRemainingMs = Math.max(deathDate - now, 0);
        const ratio = getConditionsRatio(data);
        const effectiveRemainingMs = rawRemainingMs * ratio;

        const productiveDays = Math.floor(effectiveRemainingMs / (24 * 60 * 60 * 1000));
        const productiveWeeks = Math.floor(productiveDays / 7);
        const productiveYears = Math.floor(productiveDays / 365.25);
        const productiveHours = Math.floor(effectiveRemainingMs / (60 * 60 * 1000));

        return {
            totalWeeks,
            livedWeeks,
            ratio,
            rawRemainingMs,
            effectiveRemainingMs,
            productiveDays,
            productiveWeeks,
            productiveYears,
            productiveHours,
            hasExcluded: ratio < 1
        };
    }

    function formatNumber(value) {
        return new Intl.NumberFormat().format(Math.max(0, Math.floor(value)));
    }

    return {
        STORAGE_KEY,
        computeSummary,
        formatNumber
    };
})();
