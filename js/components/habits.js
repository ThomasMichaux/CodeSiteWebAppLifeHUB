import { clearFieldErrors, escapeHtml, generateId, habitStreak, saveData, setFieldError, showToast, today } from '../utilities.js';
import { closeModal, openModal } from '../animations.js';
import { updateDashboardStats } from './dashboard.js';

const CHECK_ICON = '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

export function initHabits(appState) {
    const list = document.getElementById('habit-list');
    const empty = document.getElementById('habits-empty');
    const addBtn = document.getElementById('habit-add-btn');
    const form = document.getElementById('habit-form');
    const nameInput = document.getElementById('habit-name-input');
    const iconInput = document.getElementById('habit-icon-input');

    function commit() {
        saveData(appState.data);
        renderHabits();
        updateDashboardStats(appState);
    }

    function renderHabits() {
        const habits = appState.data.habits;
        if (!list) return;

        list.innerHTML = '';
        if (habits.length === 0) {
            if (empty) {
                empty.style.display = '';
                list.appendChild(empty);
            }
            return;
        }

        if (empty) empty.style.display = 'none';
        const fragment = document.createDocumentFragment();
        habits.forEach((habit) => fragment.appendChild(createHabitElement(habit)));
        list.appendChild(fragment);
    }

    function createHabitElement(habit) {
        const todayStr = today();
        const isDone = habit.dates.indexOf(todayStr) !== -1;
        const streak = habitStreak(habit.dates);

        const el = document.createElement('div');
        el.className = 'habit-item';
        el.setAttribute('role', 'listitem');
        el.dataset.id = habit.id;

        el.innerHTML = `
            <div class="habit-item__icon" aria-hidden="true">${escapeHtml(habit.icon)}</div>
            <div class="habit-item__info">
                <div class="habit-item__name">${escapeHtml(habit.name)}</div>
                <div class="habit-item__streak">${streak} day streak</div>
            </div>
            <button type="button" class="habit-item__check ${isDone ? 'is-done' : ''}" aria-pressed="${isDone}" aria-label="${isDone ? 'Uncheck' : 'Check'} ${escapeHtml(habit.name)} for today">${isDone ? CHECK_ICON : ''}</button>`;

        el.querySelector('.habit-item__check').addEventListener('click', () => {
            const index = habit.dates.indexOf(todayStr);
            if (index === -1) {
                habit.dates.push(todayStr);
                habit.dates.sort();
            } else {
                habit.dates.splice(index, 1);
            }

            const nowDone = index === -1;
            commit();
            showToast({ title: nowDone ? 'Habit checked!' : 'Habit unchecked', type: nowDone ? 'success' : 'info' });

            const refreshed = list.querySelector(`[data-id="${habit.id}"] .habit-item__check`);
            if (refreshed) refreshed.focus();
        });

        return el;
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            clearFieldErrors(form);
            openModal('modal-habit', addBtn);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!nameInput) return;

            const name = nameInput.value.trim();
            if (!name) {
                setFieldError(nameInput, 'Enter a name for this habit.');
                nameInput.focus();
                return;
            }
            setFieldError(nameInput, '');

            appState.data.habits.push({
                id: generateId(),
                name,
                icon: iconInput ? iconInput.value : '🎯',
                dates: []
            });

            commit();
            closeModal(document.getElementById('modal-habit'));
            form.reset();
            showToast({ title: 'Habit created!', type: 'success' });
        });
    }

    renderHabits();
}