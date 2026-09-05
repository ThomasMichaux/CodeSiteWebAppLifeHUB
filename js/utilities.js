const STORAGE_KEY = 'lifehub_data';
const THEME_KEY = 'theme-preference';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function toText(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toNumber(value, fallback, min, max) {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(parsed)) return fallback;
    let result = parsed;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
}

function toDateOnly(value, fallback) {
    return typeof value === 'string' && DATE_PATTERN.test(value) ? value : fallback;
}

function toTimestamp(value) {
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
    return new Date().toISOString();
}

function toMood(value) {
    if (value === '' || value === null || value === undefined) return 0;
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.min(5, Math.max(1, Math.round(parsed)));
}

function normalizeDates(value) {
    const unique = new Set();
    toArray(value).forEach((entry) => {
        if (typeof entry === 'string' && DATE_PATTERN.test(entry)) unique.add(entry);
    });
    return Array.from(unique).sort();
}

function normalizeHealthEntry(value) {
    if (!isPlainObject(value)) return null;
    const entry = {
        steps: Math.round(toNumber(value.steps, 0, 0)),
        water: Math.round(toNumber(value.water, 0, 0)),
        sleep: toNumber(value.sleep, 0, 0, 24),
        mood: toMood(value.mood)
    };
    if (!entry.steps && !entry.water && !entry.sleep && !entry.mood) return null;
    return entry;
}

function normalizeHealth(value) {
    const result = {};
    if (!isPlainObject(value)) return result;

    const isLegacyShape = ['steps', 'water', 'sleep', 'mood'].some((key) => key in value);
    if (isLegacyShape) {
        const entry = normalizeHealthEntry(value);
        if (entry) result[today()] = entry;
        return result;
    }

    Object.keys(value).forEach((key) => {
        if (!DATE_PATTERN.test(key)) return;
        const entry = normalizeHealthEntry(value[key]);
        if (entry) result[key] = entry;
    });
    return result;
}

export function normalizeData(input) {
    const data = getDefaultData();
    if (!isPlainObject(input)) return data;

    if (Array.isArray(input.tasks)) {
        data.tasks = input.tasks
            .filter(isPlainObject)
            .map((task) => ({
                id: toText(task.id, generateId()),
                text: toText(task.text, ''),
                done: task.done === true,
                created: toTimestamp(task.created)
            }))
            .filter((task) => task.text);
    }

    if (Array.isArray(input.habits)) {
        data.habits = input.habits
            .filter(isPlainObject)
            .map((habit) => ({
                id: toText(habit.id, generateId()),
                name: toText(habit.name, ''),
                icon: toText(habit.icon, '🎯'),
                dates: normalizeDates(habit.dates)
            }))
            .filter((habit) => habit.name);
    }

    data.health = normalizeHealth(input.health);

    if (Array.isArray(input.goals)) {
        data.goals = input.goals
            .filter(isPlainObject)
            .map((goal) => {
                const target = Math.round(toNumber(goal.target, 1, 1));
                return {
                    id: toText(goal.id, generateId()),
                    title: toText(goal.title, ''),
                    target,
                    current: Math.round(toNumber(goal.current, 0, 0, target))
                };
            })
            .filter((goal) => goal.title);
    }

    if (Array.isArray(input.events)) {
        data.events = input.events
            .filter(isPlainObject)
            .map((event) => ({
                id: toText(event.id, generateId()),
                title: toText(event.title, ''),
                date: toDateOnly(event.date, '')
            }))
            .filter((event) => event.title && event.date);
    }

    if (Array.isArray(input.notes)) {
        data.notes = input.notes
            .filter(isPlainObject)
            .map((note) => ({
                id: toText(note.id, generateId()),
                title: toText(note.title, ''),
                content: typeof note.content === 'string' ? note.content : '',
                created: toTimestamp(note.created)
            }))
            .filter((note) => note.title);
    }

    if (isPlainObject(input.finances)) {
        data.finances = {
            budget: Math.round(toNumber(input.finances.budget, 2500, 0)),
            expenses: toArray(input.finances.expenses)
                .filter(isPlainObject)
                .map((expense) => ({
                    id: toText(expense.id, generateId()),
                    label: toText(expense.label, ''),
                    amount: toNumber(expense.amount, 0, 0),
                    date: toDateOnly(expense.date, today())
                }))
                .filter((expense) => expense.label && expense.amount > 0)
        };
    }

    data.onboardingDone = input.onboardingDone === true;
    return data;
}

export function loadData() {
    let parsed = null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        parsed = raw ? JSON.parse(raw) : null;
    } catch {
        parsed = null;
    }
    return normalizeData(parsed);
}

export function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        showToast({ title: 'Storage error', message: 'Could not save your data. Your browser storage may be full.', type: 'error', duration: 0 });
    }
}

export function getDefaultData() {
    return {
        tasks: [],
        habits: [
            { id: 'h1', name: 'Morning Run', icon: '🏃', dates: [] },
            { id: 'h2', name: 'Read 30 mins', icon: '📚', dates: [] },
            { id: 'h3', name: 'Drink 8 glasses water', icon: '💧', dates: [] }
        ],
        health: {},
        goals: [],
        events: [],
        notes: [],
        finances: { budget: 2500, expenses: [] },
        onboardingDone: false
    };
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function toDateString(date) {
    const value = date || new Date();
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
}

export function today() {
    return toDateString();
}

export function currentMonthKey() {
    return today().slice(0, 7);
}

export function monthKey(month, year) {
    return year + '-' + String(month + 1).padStart(2, '0');
}

export function getMonthName(month) {
    return MONTH_NAMES[month];
}

export function firstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
}

export function formatDate(dateStr) {
    if (typeof dateStr !== 'string' || !DATE_PATTERN.test(dateStr)) return '';
    const parsed = new Date(dateStr + 'T00:00:00');
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTimestamp(value) {
    return formatDate(typeof value === 'string' ? value.slice(0, 10) : '');
}

export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function sortTasks(tasks) {
    return tasks.slice().sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return Date.parse(b.created) - Date.parse(a.created);
    });
}

export function habitStreak(dates) {
    const done = new Set(toArray(dates));
    const cursor = new Date();

    if (!done.has(toDateString(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
        if (!done.has(toDateString(cursor))) return 0;
    }

    let streak = 0;
    while (done.has(toDateString(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export function calcBudget(finances, month) {
    const key = month || currentMonthKey();
    const budget = finances.budget || 0;
    const spent = finances.expenses
        .filter((expense) => expense.date.slice(0, 7) === key)
        .reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = budget - spent;
    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    return { budget, spent, remaining, pct };
}

export function formatMoney(amount) {
    const hasCents = Math.round(amount * 100) % 100 !== 0;
    return '$' + amount.toLocaleString('en-US', {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2
    });
}

export function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function setFieldError(input, message) {
    const group = input.closest('.form-group');
    if (!group) return;

    let hint = group.querySelector('.form-hint');

    if (!message) {
        group.classList.remove('has-error');
        input.removeAttribute('aria-invalid');
        if (hint) hint.textContent = '';
        return;
    }

    if (!hint) {
        hint = document.createElement('p');
        hint.className = 'form-hint';
        hint.id = input.id + '-error';
        hint.setAttribute('role', 'alert');
        group.appendChild(hint);
    }

    hint.textContent = message;
    group.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', hint.id);
}

export function clearFieldErrors(form) {
    if (!form) return;
    form.querySelectorAll('.form-input, .form-textarea').forEach((input) => setFieldError(input, ''));
}

export function showToast({ title, message, type, duration }) {
    const region = document.getElementById('toast-region');
    if (!region) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast--' + (type || 'info');
    toast.innerHTML = `
        <div class="toast__body">
            <p class="toast__title">${escapeHtml(title)}</p>
            ${message ? `<p class="toast__message">${escapeHtml(message)}</p>` : ''}
        </div>
        <button type="button" class="btn btn--icon btn--ghost" aria-label="Close notification">
            <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>`;

    const remove = () => {
        toast.classList.add('is-leaving');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
        setTimeout(() => toast.remove(), 1000);
    };

    toast.querySelector('button').addEventListener('click', remove);
    region.appendChild(toast);
    if (duration !== 0) setTimeout(remove, duration || 4000);
}

export function getThemePreference() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function hasStoredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' || stored === 'light';
}

export function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem(THEME_KEY, theme);
    updateThemeUI(theme);
}

function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
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