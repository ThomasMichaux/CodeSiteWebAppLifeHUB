import { escapeHtml, formatTimestamp, generateId, saveData, showToast, sortTasks } from '../utilities.js';
import { updateDashboardStats } from './dashboard.js';

const DELETE_ICON = '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

export function initTasks(appState) {
    const input = document.getElementById('task-input');
    const addBtn = document.getElementById('task-add-btn');
    const list = document.getElementById('task-list');
    const empty = document.getElementById('tasks-empty');
    const badge = document.getElementById('tasks-badge');
    const countEl = document.getElementById('task-count');

    function commit() {
        saveData(appState.data);
        renderTasks();
        updateDashboardStats(appState);
    }

    function renderTasks() {
        const tasks = appState.data.tasks;
        const pending = tasks.filter((task) => !task.done).length;

        if (badge) badge.textContent = pending + ' pending';
        if (countEl) countEl.textContent = pending;

        if (!list) return;

        list.innerHTML = '';
        if (tasks.length === 0) {
            if (empty) {
                empty.style.display = '';
                list.appendChild(empty);
            }
            return;
        }

        if (empty) empty.style.display = 'none';
        const fragment = document.createDocumentFragment();
        sortTasks(tasks).forEach((task) => fragment.appendChild(createTaskElement(task)));
        list.appendChild(fragment);
    }

    function createTaskElement(task) {
        const el = document.createElement('div');
        el.className = 'task-item' + (task.done ? ' is-completed' : '');
        el.setAttribute('role', 'listitem');
        el.dataset.id = task.id;

        const created = formatTimestamp(task.created);
        el.innerHTML = `
            <input type="checkbox" class="task-item__checkbox" ${task.done ? 'checked' : ''} aria-label="Mark ${escapeHtml(task.text)} as ${task.done ? 'incomplete' : 'complete'}">
            <div class="task-item__content">
                <div class="task-item__title">${escapeHtml(task.text)}</div>
                ${created ? `<div class="task-item__meta"><span>${created}</span></div>` : ''}
            </div>
            <div class="task-item__actions">
                <button type="button" class="task-item__action-btn task-item__action-btn--delete" aria-label="Delete task ${escapeHtml(task.text)}">${DELETE_ICON}</button>
            </div>`;

        el.querySelector('.task-item__checkbox').addEventListener('change', (e) => {
            task.done = e.target.checked;
            commit();
            showToast({ title: task.done ? 'Task completed' : 'Task reopened', type: 'success' });
        });

        el.querySelector('.task-item__action-btn--delete').addEventListener('click', () => {
            appState.data.tasks = appState.data.tasks.filter((entry) => entry.id !== task.id);
            commit();
            showToast({ title: 'Task deleted', type: 'info' });
        });

        return el;
    }

    function addTask(text) {
        const trimmed = text.trim();
        if (!trimmed) return false;
        appState.data.tasks.push({
            id: generateId(),
            text: trimmed,
            done: false,
            created: new Date().toISOString()
        });
        commit();
        return true;
    }

    if (addBtn && input) {
        addBtn.addEventListener('click', () => {
            if (addTask(input.value)) {
                input.value = '';
                input.focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (addTask(input.value)) input.value = '';
            }
        });
    }

    renderTasks();
}