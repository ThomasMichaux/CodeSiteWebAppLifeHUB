(function () {
    'use strict';

    // ── App State ──────────────────────────────────
    var appState = {
        data: loadData(),
        currentSection: 'dashboard'
    };

    // ── Theme Init ─────────────────────────────────
    var theme = getThemePreference();
    applyTheme(theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem('theme-preference')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // ── Theme Toggle (header) ──────────────────────
    var headerThemeToggle = document.getElementById('theme-toggle');
    if (headerThemeToggle) {
        headerThemeToggle.addEventListener('click', function () {
            var current = getThemePreference();
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    }

    // ── Init All Modules ───────────────────────────
    document.addEventListener('DOMContentLoaded', function () {

        // Layout
        initSidebar();
        initNavigation(appState);
        initSearchToggle();
        initHeaderSearch(appState);

        // Components
        initTasks(appState);
        initHabits(appState);
        initHealth(appState);
        initGoals(appState);
        initCalendar(appState);
        initNotes(appState);
        initFinances(appState);
        initSearch(appState);
        initSettings(appState);
        initModals();
        initOnboarding(appState);

        // Scroll animations
        initScrollAnimations();

        // Initial dashboard stats update
        updateDashboardStats(appState);

        console.log('LifeHUB initialized successfully.');
    });

})();