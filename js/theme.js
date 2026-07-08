/**
 * theme.js - Theme Manager for Nihon Journey
 * Applies light/dark theme based on local storage settings.
 */

(function () {
    // Read theme from settings
    function getSavedTheme() {
        try {
            const settings = JSON.parse(localStorage.getItem('nihon_user_settings'));
            return (settings && settings.theme) || 'light';
        } catch (e) {
            return 'light';
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update settings in local storage
        try {
            const settings = JSON.parse(localStorage.getItem('nihon_user_settings')) || {
                username: 'Tabi-bito (旅人)',
                dailyTaskGoal: 3,
                dailyHoursGoal: 30,
                theme: 'light'
            };
            settings.theme = theme;
            localStorage.setItem('nihon_user_settings', JSON.stringify(settings));
        } catch (e) {
            // Silently fail
        }
    }

    // Initialize theme immediately to prevent flashing
    const currentTheme = getSavedTheme();
    applyTheme(currentTheme);

    // Expose utility function
    window.NihonTheme = {
        getTheme() {
            return document.documentElement.getAttribute('data-theme') || 'light';
        },
        setTheme(theme) {
            applyTheme(theme);
        },
        toggleTheme() {
            const nextTheme = this.getTheme() === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
            return nextTheme;
        }
    };
})();
