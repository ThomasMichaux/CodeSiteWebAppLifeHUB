import { clearFieldErrors, saveData, setFieldError, showToast, today } from '../utilities.js';
import { updateDashboardStats } from './dashboard.js';

const FIELDS = [
    { key: 'steps', inputId: 'health-steps-input', valueId: 'health-steps', label: 'Steps', min: 0, max: 200000, integer: true },
    { key: 'water', inputId: 'health-water-input', valueId: 'health-water', label: 'Water', min: 0, max: 50, integer: true },
    { key: 'sleep', inputId: 'health-sleep-input', valueId: 'health-sleep', label: 'Sleep', min: 0, max: 24, integer: false },
    { key: 'mood', inputId: 'health-mood-input', valueId: 'health-mood', label: 'Mood', min: 1, max: 5, integer: true }
];

export function initHealth(appState) {
    const form = document.getElementById('health-form');

    function todayEntry() {
        return appState.data.health[today()] || { steps: 0, water: 0, sleep: 0, mood: 0 };
    }

    function renderHealth() {
        const entry = todayEntry();

        FIELDS.forEach((field) => {
            const el = document.getElementById(field.valueId);
            if (!el) return;
            const value = entry[field.key];
            if (field.key === 'mood') {
                el.textContent = value ? value : '--';
            } else {
                el.textContent = value.toLocaleString('en-US');
            }
        });
    }

    function fillForm() {
        const entry = todayEntry();
        FIELDS.forEach((field) => {
            const input = document.getElementById(field.inputId);
            if (input) input.value = entry[field.key] ? String(entry[field.key]) : '';
        });
    }

    function readField(field) {
        const input = document.getElementById(field.inputId);
        if (!input) return { value: 0, valid: true };

        const raw = input.value.trim();
        if (!raw) return { value: 0, valid: true, input };

        const parsed = field.integer ? parseInt(raw, 10) : parseFloat(raw);
        if (!Number.isFinite(parsed)) {
            setFieldError(input, 'Enter a number.');
            return { valid: false, input };
        }
        if (parsed < field.min || parsed > field.max) {
            setFieldError(input, `${field.label} must be between ${field.min} and ${field.max}.`);
            return { valid: false, input };
        }

        setFieldError(input, '');
        return { value: parsed, valid: true, input };
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFieldErrors(form);

            const entry = {};
            let firstInvalid = null;

            FIELDS.forEach((field) => {
                const result = readField(field);
                if (!result.valid) {
                    if (!firstInvalid) firstInvalid = result.input;
                    return;
                }
                entry[field.key] = result.value;
            });

            if (firstInvalid) {
                firstInvalid.focus();
                return;
            }

            const hasValue = FIELDS.some((field) => entry[field.key]);
            const todayStr = today();
            if (hasValue) {
                appState.data.health[todayStr] = entry;
            } else {
                delete appState.data.health[todayStr];
            }

            saveData(appState.data);
            renderHealth();
            fillForm();
            updateDashboardStats(appState);
            showToast({ title: 'Health data saved!', type: 'success' });
        });
    }

    renderHealth();
    fillForm();
}