import { calcBudget, currentMonthKey, escapeHtml, formatMoney, habitStreak, sortTasks, today } from '../utilities.js';

const RECENT_TASK_LIMIT = 5;

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderTaskStats(data) {
    const pending = data.tasks.filter((task) => !task.done).length;

    setText('dashboard-tasks-total', data.tasks.length);
    setText('dashboard-tasks-pending', pending + ' pending');

    const container = document.getElementById('dashboard-recent-tasks');
    if (!container) return;

    const recent = sortTasks(data.tasks).slice(0, RECENT_TASK_LIMIT);
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted">No recent tasks</p>';
        return;
    }

    container.innerHTML = '';
    recent.forEach((task) => {
        const item = document.createElement('div');
        item.className = 'task-item task-item--compact' + (task.done ? ' is-completed' : '');
        item.innerHTML = `<span class="task-item__title text-sm">${escapeHtml(task.text)}</span>`;
        container.appendChild(item);
    });
}

function renderHabitStats(data) {
    const todayStr = today();
    const doneCount = data.habits.filter((habit) => habit.dates.indexOf(todayStr) !== -1).length;

    setText('dashboard-habits-done', doneCount + '/' + data.habits.length);
    setText('dashboard-habits-label', 'completed today');

    const container = document.getElementById('dashboard-today-habits');
    if (!container) return;

    if (data.habits.length === 0) {
        container.innerHTML = '<p class="text-sm text-muted">No habits tracked today</p>';
        return;
    }

    container.innerHTML = '';
    data.habits.forEach((habit) => {
        const isDone = habit.dates.indexOf(todayStr) !== -1;
        const item = document.createElement('div');
        item.className = 'flex flex--between p-2';
        item.innerHTML = `
            <span class="text-sm">${escapeHtml(habit.icon)} ${escapeHtml(habit.name)}</span>
            <span class="badge ${isDone ? 'badge--success' : 'badge--neutral'}">${isDone ? 'Done' : 'Pending'}</span>`;
        container.appendChild(item);
    });
}

function renderGoalStats(data) {
    let progress = 0;
    if (data.goals.length > 0) {
        const sum = data.goals.reduce((acc, goal) => acc + (goal.target > 0 ? Math.min(1, goal.current / goal.target) : 0), 0);
        progress = Math.round((sum / data.goals.length) * 100);
    }

    setText('dashboard-goals-progress', progress + '%');
    setText('dashboard-goals-label', data.goals.length > 0 ? 'overall progress' : 'no goals set');
}

function renderBudgetStats(data) {
    const { remaining } = calcBudget(data.finances);
    setText('dashboard-budget-remaining', formatMoney(Math.max(0, remaining)));
    setText('dashboard-budget-label', 'remaining this month');
}

function renderQuickStats(data) {
    setText('dashboard-notes-count', data.notes.length);

    const monthPrefix = currentMonthKey();
    const monthEvents = data.events.filter((event) => event.date.slice(0, 7) === monthPrefix);
    setText('dashboard-calendar-count', monthEvents.length);

    const longest = data.habits.reduce((max, habit) => Math.max(max, habitStreak(habit.dates)), 0);
    setText('dashboard-streak', longest);
}

export function updateDashboardStats(appState) {
    const data = appState.data;
    renderTaskStats(data);
    renderHabitStats(data);
    renderGoalStats(data);
    renderBudgetStats(data);
    renderQuickStats(data);
}