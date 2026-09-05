import { clearFieldErrors, escapeHtml, generateId, saveData, setFieldError, showToast } from '../utilities.js';
import { closeModal, openModal } from '../animations.js';
import { updateDashboardStats } from './dashboard.js';

export function initGoals(appState) {
    const list = document.getElementById('goal-list');
    const empty = document.getElementById('goals-empty');
    const addBtn = document.getElementById('goal-add-btn');
    const form = document.getElementById('goal-form');
    const titleInput = document.getElementById('goal-title-input');
    const targetInput = document.getElementById('goal-target-input');
    const currentInput = document.getElementById('goal-current-input');

    function commit() {
        saveData(appState.data);
        renderGoals();
        updateDashboardStats(appState);
    }

    function renderGoals() {
        const goals = appState.data.goals;
        if (!list) return;

        list.innerHTML = '';
        if (goals.length === 0) {
            if (empty) {
                empty.style.display = '';
                list.appendChild(empty);
            }
            return;
        }

        if (empty) empty.style.display = 'none';
        const fragment = document.createDocumentFragment();
        goals.forEach((goal) => fragment.appendChild(createGoalElement(goal)));
        list.appendChild(fragment);
    }

    function createGoalElement(goal) {
        const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
        const isComplete = goal.current >= goal.target;

        const el = document.createElement('div');
        el.className = 'goal-item';
        el.setAttribute('role', 'listitem');
        el.dataset.id = goal.id;

        el.innerHTML = `
            <div class="goal-item__header">
                <div class="goal-item__title">${escapeHtml(goal.title)}</div>
                <div class="goal-item__progress-text">${goal.current} / ${goal.target}</div>
            </div>
            <div class="goal-item__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(goal.title)} progress">
                <div class="goal-item__bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="flex gap-2 mt-2">
                <button type="button" class="btn btn--ghost btn--sm goal-increment"${isComplete ? ' disabled' : ''} aria-label="Add one to ${escapeHtml(goal.title)}">+1</button>
                <button type="button" class="btn btn--ghost btn--sm goal-delete" aria-label="Delete goal ${escapeHtml(goal.title)}">Delete</button>
            </div>`;

        el.querySelector('.goal-increment').addEventListener('click', () => {
            if (goal.current >= goal.target) return;
            goal.current++;
            const reached = goal.current >= goal.target;
            commit();
            if (reached) showToast({ title: 'Goal reached!', message: goal.title, type: 'success' });
        });

        el.querySelector('.goal-delete').addEventListener('click', () => {
            appState.data.goals = appState.data.goals.filter((entry) => entry.id !== goal.id);
            commit();
            showToast({ title: 'Goal deleted', type: 'info' });
        });

        return el;
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            clearFieldErrors(form);
            openModal('modal-goal', addBtn);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!titleInput || !targetInput) return;
            clearFieldErrors(form);

            const title = titleInput.value.trim();
            if (!title) {
                setFieldError(titleInput, 'Give this goal a name.');
                titleInput.focus();
                return;
            }

            const target = parseInt(targetInput.value, 10);
            if (!Number.isFinite(target) || target < 1) {
                setFieldError(targetInput, 'Target must be a whole number of 1 or more.');
                targetInput.focus();
                return;
            }

            const rawCurrent = currentInput ? parseInt(currentInput.value, 10) : 0;
            const current = Number.isFinite(rawCurrent) ? Math.max(0, rawCurrent) : 0;
            if (current > target) {
                setFieldError(currentInput, 'Current progress cannot exceed the target.');
                currentInput.focus();
                return;
            }

            appState.data.goals.push({ id: generateId(), title, target, current });
            commit();
            closeModal(document.getElementById('modal-goal'));
            form.reset();
            showToast({ title: 'Goal created!', type: 'success' });
        });
    }

    renderGoals();
}