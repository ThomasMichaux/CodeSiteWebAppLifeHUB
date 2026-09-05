import { clearFieldErrors, escapeHtml, firstDayOfMonth, formatDate, generateId, getMonthName, monthKey, saveData, setFieldError, showToast, toDateString, today } from '../utilities.js';
import { closeModal, openModal } from '../animations.js';
import { updateDashboardStats } from './dashboard.js';

const CLOSE_ICON = '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CELL_COUNT = 42;
const UPCOMING_LIMIT = 10;

export function initCalendar(appState) {
    const grid = document.getElementById('cal-grid');
    const monthLabel = document.getElementById('cal-month');
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    const eventList = document.getElementById('event-list');
    const eventsEmpty = document.getElementById('events-empty');
    const eventsHeading = document.getElementById('events-heading');
    const addBtn = document.getElementById('event-add-btn');
    const form = document.getElementById('event-form');
    const titleInput = document.getElementById('event-title-input');
    const dateInput = document.getElementById('event-date-input');

    const startOfToday = new Date();
    const calState = {
        month: startOfToday.getMonth(),
        year: startOfToday.getFullYear(),
        selected: null,
        focused: null
    };

    function commit() {
        saveData(appState.data);
        renderCalendar();
        updateDashboardStats(appState);
    }

    function buildCells(month, year) {
        const leading = firstDayOfMonth(month, year);
        const start = new Date(year, month, 1 - leading);
        const cells = [];

        for (let i = 0; i < CELL_COUNT; i++) {
            const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            cells.push({
                day: date.getDate(),
                dateStr: toDateString(date),
                other: date.getMonth() !== month
            });
        }
        return cells;
    }

    function ensureFocusedDate(cells) {
        if (calState.focused && cells.some((cell) => cell.dateStr === calState.focused)) return;

        const todayStr = today();
        const hasToday = cells.some((cell) => cell.dateStr === todayStr && !cell.other);
        calState.focused = hasToday ? todayStr : monthKey(calState.month, calState.year) + '-01';
    }

    function createDayCell(cell, todayStr) {
        const el = document.createElement('div');
        el.className = 'calendar__day';
        el.setAttribute('role', 'gridcell');
        el.dataset.date = cell.dateStr;
        el.textContent = cell.day;

        if (cell.other) el.classList.add('is-other-month');
        if (cell.dateStr === todayStr) el.classList.add('is-today');
        if (cell.dateStr === calState.selected) el.classList.add('is-selected');

        const eventCount = appState.data.events.filter((event) => event.date === cell.dateStr).length;
        if (eventCount > 0) el.classList.add('calendar__day--has-event');

        const parts = [formatDate(cell.dateStr)];
        if (cell.dateStr === todayStr) parts.push('today');
        if (eventCount === 1) parts.push('1 event');
        if (eventCount > 1) parts.push(eventCount + ' events');

        el.setAttribute('aria-label', parts.join(', '));
        el.setAttribute('aria-selected', String(cell.dateStr === calState.selected));
        el.setAttribute('tabindex', cell.dateStr === calState.focused ? '0' : '-1');

        return el;
    }

    function renderCalendar() {
        if (monthLabel) monthLabel.textContent = getMonthName(calState.month) + ' ' + calState.year;
        if (!grid) return;

        const todayStr = today();
        const cells = buildCells(calState.month, calState.year);
        ensureFocusedDate(cells);

        grid.innerHTML = '';

        const headerRow = document.createElement('div');
        headerRow.className = 'calendar__row';
        headerRow.setAttribute('role', 'row');
        DAY_LABELS.forEach((label, index) => {
            const header = document.createElement('div');
            header.className = 'calendar__day-header';
            header.setAttribute('role', 'columnheader');
            header.setAttribute('aria-label', DAY_NAMES[index]);
            header.textContent = label;
            headerRow.appendChild(header);
        });
        grid.appendChild(headerRow);

        for (let i = 0; i < cells.length; i += 7) {
            const row = document.createElement('div');
            row.className = 'calendar__row';
            row.setAttribute('role', 'row');
            cells.slice(i, i + 7).forEach((cell) => row.appendChild(createDayCell(cell, todayStr)));
            grid.appendChild(row);
        }

        renderEvents();
    }

    function focusDate(dateStr, moveFocus) {
        const target = new Date(dateStr + 'T00:00:00');
        calState.focused = dateStr;

        if (target.getMonth() !== calState.month || target.getFullYear() !== calState.year) {
            calState.month = target.getMonth();
            calState.year = target.getFullYear();
            renderCalendar();
        } else if (grid) {
            grid.querySelectorAll('.calendar__day').forEach((cell) => {
                cell.setAttribute('tabindex', cell.dataset.date === dateStr ? '0' : '-1');
            });
        }

        if (!moveFocus || !grid) return;
        const cell = grid.querySelector(`[data-date="${dateStr}"]`);
        if (cell) cell.focus();
    }

    function shiftFocus(days) {
        const cursor = new Date(calState.focused + 'T00:00:00');
        cursor.setDate(cursor.getDate() + days);
        focusDate(toDateString(cursor), true);
    }

    function shiftMonth(delta) {
        const cursor = new Date(calState.year, calState.month + delta, 1);
        calState.month = cursor.getMonth();
        calState.year = cursor.getFullYear();
        calState.focused = null;
        renderCalendar();
    }

    function toggleSelection(dateStr) {
        calState.selected = calState.selected === dateStr ? null : dateStr;
        calState.focused = dateStr;
        renderCalendar();
        const cell = grid ? grid.querySelector(`[data-date="${dateStr}"]`) : null;
        if (cell) cell.focus();
    }

    function renderEvents() {
        const sorted = appState.data.events.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
        let visible;

        if (calState.selected) {
            visible = sorted.filter((event) => event.date === calState.selected);
            if (eventsHeading) eventsHeading.textContent = 'Events on ' + formatDate(calState.selected);
        } else {
            const todayStr = today();
            visible = sorted.filter((event) => event.date >= todayStr).slice(0, UPCOMING_LIMIT);
            if (eventsHeading) eventsHeading.textContent = 'Upcoming Events';
        }

        if (!eventList) return;

        eventList.innerHTML = '';
        if (visible.length === 0) {
            if (eventsEmpty) {
                eventsEmpty.style.display = '';
                eventList.appendChild(eventsEmpty);
            }
            return;
        }

        if (eventsEmpty) eventsEmpty.style.display = 'none';
        const fragment = document.createDocumentFragment();
        visible.forEach((event) => {
            const el = document.createElement('div');
            el.className = 'event-list-item';
            el.innerHTML = `
                <div class="event-list-item__info">
                    <div class="event-list-item__title">${escapeHtml(event.title)}</div>
                    <div class="event-list-item__meta">${formatDate(event.date)}</div>
                </div>
                <button type="button" class="btn btn--icon btn--ghost btn--sm event-delete" aria-label="Delete event ${escapeHtml(event.title)}">${CLOSE_ICON}</button>`;

            el.querySelector('.event-delete').addEventListener('click', () => {
                appState.data.events = appState.data.events.filter((entry) => entry.id !== event.id);
                commit();
                showToast({ title: 'Event deleted', type: 'info' });
            });
            fragment.appendChild(el);
        });
        eventList.appendChild(fragment);
    }

    if (grid) {
        grid.addEventListener('click', (e) => {
            const cell = e.target.closest('.calendar__day');
            if (cell) toggleSelection(cell.dataset.date);
        });

        grid.addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('calendar__day')) return;

            const handlers = {
                ArrowLeft: () => shiftFocus(-1),
                ArrowRight: () => shiftFocus(1),
                ArrowUp: () => shiftFocus(-7),
                ArrowDown: () => shiftFocus(7),
                Home: () => shiftFocus(-new Date(calState.focused + 'T00:00:00').getDay()),
                End: () => shiftFocus(6 - new Date(calState.focused + 'T00:00:00').getDay()),
                PageUp: () => shiftMonth(-1),
                PageDown: () => shiftMonth(1)
            };

            if (handlers[e.key]) {
                e.preventDefault();
                handlers[e.key]();
                return;
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSelection(e.target.dataset.date);
            }
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => shiftMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => shiftMonth(1));

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            clearFieldErrors(form);
            if (dateInput) dateInput.value = calState.selected || today();
            openModal('modal-event', addBtn);
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!titleInput || !dateInput) return;
            clearFieldErrors(form);

            const title = titleInput.value.trim();
            if (!title) {
                setFieldError(titleInput, 'Give this event a title.');
                titleInput.focus();
                return;
            }

            const date = dateInput.value;
            if (!date) {
                setFieldError(dateInput, 'Pick a date for this event.');
                dateInput.focus();
                return;
            }

            appState.data.events.push({ id: generateId(), title, date });
            commit();
            closeModal(document.getElementById('modal-event'));
            form.reset();
            showToast({ title: 'Event added!', type: 'success' });
        });
    }

    renderCalendar();
}