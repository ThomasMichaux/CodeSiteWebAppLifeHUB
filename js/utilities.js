// ── Constants ────────────────────────────────────
const STORAGE_KEY = 'lifehub_data';
const THEME_KEY = 'theme-preference';

// ── Storage ──────────────────────────────────────
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : getDefaultData();
    } catch {
        return getDefaultData();
    }
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        showToast({ title: 'Storage error', message: 'Could not save data.', type: 'error', duration: 0 });
    }
}

function getDefaultData() {
    return {
        tasks: [],
        habits: [
            { id: 'h1', name: 'Morning Run', icon: '🏃', streak: 0, done: false, dates: [] },
            { id: 'h2', name: 'Read 30 mins', icon: '📚', streak: 0, done: false, dates: [] },
            { id: 'h3', name: 'Drink 8 glasses water', icon: '💧', streak: 0, done: false, dates: [] }
        ],
        health: { steps: 0, water: 0, sleep: 0, mood: '' },
        goals: [],
        events: [],
        notes: [],
        finances: { budget: 2500, expenses: [] },
        onboardingDone: false
    };
}

// ── ID Generator ─────────────────────────────────
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Date Helpers ─────────────────────────────────
function today() {
    return new Date().toISOString().split('T')[0];
}

function getMonthYear(date) {
    const d = date || new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
}

function getMonthName(month) {
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return names[month];
}

function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Escape HTML ──────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ── Budget Calculation ───────────────────────────
function calcBudget(finances) {
    var budget = finances.budget || 0;
    var spent = finances.expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
    var remaining = budget - spent;
    var pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    return { budget: budget, spent: spent, remaining: remaining, pct: pct };
}

// ── Debounce ─────────────────────────────────────
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ── Toast ────────────────────────────────────────
function showToast({ title, message, type, duration }) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'info');
    toast.innerHTML = '<div class="toast__body"><p class="toast__title">' + escapeHtml(title) + '</p>' +
        (message ? '<p class="toast__message">' + escapeHtml(message) + '</p>' : '') + '</div>' +
        '<button type="button" class="btn btn--icon btn--ghost" aria-label="Close notification">' +
        '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

    const remove = function () {
        toast.classList.add('is-leaving');
        toast.addEventListener('animationend', function () { toast.remove(); }, { once: true });
    };

    toast.querySelector('button').addEventListener('click', remove);
    region.appendChild(toast);
    if (duration !== 0) setTimeout(remove, duration || 4000);
}

// ── Theme ────────────────────────────────────────
function getThemePreference() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeUI(theme);
}

function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
        const sun = btn.querySelector('.theme-toggle__sun');
        const moon = btn.querySelector('.theme-toggle__moon');
        if (sun) sun.style.display = isDark ? 'none' : '';
        if (moon) moon.style.display = isDark ? '' : 'none';
    });
    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
    const settingsToggle = document.getElementById('settings-theme-toggle');
    if (settingsToggle) settingsToggle.setAttribute('aria-checked', String(isDark));
}