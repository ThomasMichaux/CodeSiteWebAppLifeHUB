import { applyTheme, getThemePreference, hasStoredTheme, loadData } from './utilities.js';
import { initModals } from './animations.js';
import { initNavigation, initSidebar } from './layout.js';
import { initTasks } from './components/tasks.js';
import { initHabits } from './components/habits.js';
import { initHealth } from './components/health.js';
import { initGoals } from './components/goals.js';
import { initCalendar } from './components/calendar.js';
import { initNotes } from './components/notes.js';
import { initFinances } from './components/finances.js';
import { initSearch } from './components/search.js';
import { initSettings } from './components/settings.js';
import { initOnboarding } from './components/onboarding.js';
import { updateDashboardStats } from './components/dashboard.js';

const appState = {
    data: loadData(),
    currentSection: 'dashboard'
};

applyTheme(getThemePreference(), false);

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!hasStoredTheme()) applyTheme(e.matches ? 'dark' : 'light', false);
});

const headerThemeToggle = document.getElementById('theme-toggle');
if (headerThemeToggle) {
    headerThemeToggle.addEventListener('click', () => {
        applyTheme(getThemePreference() === 'dark' ? 'light' : 'dark', true);
    });
}

initModals();
initSidebar();
initNavigation(appState);

initTasks(appState);
initHabits(appState);
initHealth(appState);
initGoals(appState);
initCalendar(appState);
initNotes(appState);
initFinances(appState);
initSearch(appState);
initSettings(appState);
initOnboarding(appState);

updateDashboardStats(appState);