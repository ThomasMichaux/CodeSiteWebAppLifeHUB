// ═══════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════
function initTasks(appState) {
    var input = document.getElementById('task-input');
    var addBtn = document.getElementById('task-add-btn');
    var list = document.getElementById('task-list');
    var empty = document.getElementById('tasks-empty');
    var badge = document.getElementById('tasks-badge');
    var countEl = document.getElementById('task-count');
    var dashTotal = document.getElementById('dashboard-tasks-total');
    var dashPending = document.getElementById('dashboard-tasks-pending');
    var dashRecent = document.getElementById('dashboard-recent-tasks');

    function renderTasks() {
        var tasks = appState.data.tasks;
        var pending = tasks.filter(function (t) { return !t.done; }).length;
        var total = tasks.length;

        // Update badges
        if (badge) badge.textContent = pending + ' pending';
        if (countEl) countEl.textContent = pending;
        if (dashTotal) dashTotal.textContent = total;
        if (dashPending) dashPending.textContent = pending + ' pending';

        // Filter and sort: incomplete first, then by date
        var sorted = tasks.slice().sort(function (a, b) {
            if (a.done !== b.done) return a.done ? 1 : -1;
            return new Date(b.created) - new Date(a.created);
        });

        // Render task list
        if (list) {
            if (sorted.length === 0) {
                list.innerHTML = '';
                if (empty) empty.style.display = '';
                list.appendChild(empty);
            } else {
                if (empty) empty.style.display = 'none';
                list.innerHTML = '';
                var fragment = document.createDocumentFragment();
                sorted.forEach(function (task) {
                    var el = createTaskElement(task);
                    fragment.appendChild(el);
                });
                list.appendChild(fragment);
            }
        }

        // Recent tasks for dashboard
        if (dashRecent) {
            var recent = sorted.slice(0, 5);
            if (recent.length === 0) {
                dashRecent.innerHTML = '<p class="text-sm text-muted">No recent tasks</p>';
            } else {
                dashRecent.innerHTML = '';
                recent.forEach(function (task) {
                    var item = document.createElement('div');
                    item.className = 'task-item' + (task.done ? ' is-completed' : '') + ' task-item--compact';
                    item.innerHTML = '<span class="task-item__title text-sm">' + escapeHtml(task.text) + '</span>';
                    dashRecent.appendChild(item);
                });
            }
        }

        saveData(appState.data);
    }

    function createTaskElement(task) {
        var el = document.createElement('div');
        el.className = 'task-item' + (task.done ? ' is-completed' : '');
        el.setAttribute('role', 'listitem');
        el.dataset.id = task.id;

        el.innerHTML = '<input type="checkbox" class="task-item__checkbox" ' + (task.done ? 'checked' : '') + ' aria-label="Mark ' + escapeHtml(task.text) + ' as ' + (task.done ? 'incomplete' : 'complete') + '">' +
            '<div class="task-item__content">' +
            '<div class="task-item__title">' + escapeHtml(task.text) + '</div>' +
            '<div class="task-item__meta"><span>' + formatDate(task.created.split('T')[0]) + '</span></div>' +
            '</div>' +
            '<div class="task-item__actions">' +
            '<button type="button" class="task-item__action-btn task-item__action-btn--delete" aria-label="Delete task">' +
            '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '</div>';

        var checkbox = el.querySelector('.task-item__checkbox');
        checkbox.addEventListener('change', function () {
            task.done = checkbox.checked;
            el.classList.toggle('is-completed', task.done);
            checkbox.setAttribute('aria-label', 'Mark ' + escapeHtml(task.text) + ' as ' + (task.done ? 'incomplete' : 'complete'));
            renderTasks();
            showToast({ title: task.done ? 'Task completed' : 'Task reopened', type: 'success' });
        });

        var deleteBtn = el.querySelector('.task-item__action-btn--delete');
        deleteBtn.addEventListener('click', function () {
            appState.data.tasks = appState.data.tasks.filter(function (t) { return t.id !== task.id; });
            renderTasks();
            showToast({ title: 'Task deleted', type: 'info' });
        });

        return el;
    }

    function addTask(text) {
        text = text.trim();
        if (!text) return false;
        appState.data.tasks.push({
            id: generateId(),
            text: text,
            done: false,
            created: new Date().toISOString()
        });
        renderTasks();
        return true;
    }

    if (addBtn && input) {
        addBtn.addEventListener('click', function () {
            if (addTask(input.value)) {
                input.value = '';
                input.focus();
            }
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (addTask(input.value)) {
                    input.value = '';
                }
            }
        });
    }

    renderTasks();
}

// ═══════════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════════
function initHabits(appState) {
    var list = document.getElementById('habit-list');
    var empty = document.getElementById('habits-empty');
    var addBtn = document.getElementById('habit-add-btn');
    var dashHabits = document.getElementById('dashboard-today-habits');
    var dashDone = document.getElementById('dashboard-habits-done');
    var dashLabel = document.getElementById('dashboard-habits-label');

    function renderHabits() {
        var habits = appState.data.habits;
        var todayStr = today();

        // Reset daily done status
        habits.forEach(function (h) {
            h.done = h.dates && h.dates.indexOf(todayStr) !== -1;
        });

        var doneCount = habits.filter(function (h) { return h.done; }).length;

        if (dashDone) dashDone.textContent = doneCount + '/' + habits.length;
        if (dashLabel) dashLabel.textContent = 'completed today';
        updateDashboardStreak(appState);

        // Dashboard today's habits
        if (dashHabits) {
            if (habits.length === 0) {
                dashHabits.innerHTML = '<p class="text-sm text-muted">No habits tracked today</p>';
            } else {
                dashHabits.innerHTML = '';
                habits.forEach(function (h) {
                    var item = document.createElement('div');
                    item.className = 'flex flex--between p-2';
                    item.innerHTML = '<span class="text-sm">' + h.icon + ' ' + escapeHtml(h.name) + '</span>' +
                        '<span class="badge ' + (h.done ? 'badge--success' : 'badge--neutral') + '">' + (h.done ? 'Done' : 'Pending') + '</span>';
                    dashHabits.appendChild(item);
                });
            }
        }

        if (list) {
            if (habits.length === 0) {
                list.innerHTML = '';
                if (empty) empty.style.display = '';
                list.appendChild(empty);
            } else {
                if (empty) empty.style.display = 'none';
                list.innerHTML = '';
                var fragment = document.createDocumentFragment();
                habits.forEach(function (h) {
                    var el = createHabitElement(h);
                    fragment.appendChild(el);
                });
                list.appendChild(fragment);
            }
        }

        saveData(appState.data);
    }

    function createHabitElement(habit) {
        var el = document.createElement('div');
        el.className = 'habit-item';
        el.setAttribute('role', 'listitem');
        el.dataset.id = habit.id;

        el.innerHTML = '<div class="habit-item__icon" aria-hidden="true">' + habit.icon + '</div>' +
            '<div class="habit-item__info">' +
            '<div class="habit-item__name">' + escapeHtml(habit.name) + '</div>' +
            '<div class="habit-item__streak">' + habit.streak + ' day streak</div>' +
            '</div>' +
            '<button type="button" class="habit-item__check ' + (habit.done ? 'is-done' : '') + '" aria-label="' + (habit.done ? 'Uncheck' : 'Check') + ' ' + escapeHtml(habit.name) + '">' +
            (habit.done ? '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') +
            '</button>';

        var checkBtn = el.querySelector('.habit-item__check');
        checkBtn.addEventListener('click', function () {
            var todayStr = today();
            if (habit.done) {
                habit.done = false;
                var idx = habit.dates.indexOf(todayStr);
                if (idx !== -1) habit.dates.splice(idx, 1);
                habit.streak = Math.max(0, habit.streak - 1);
                checkBtn.classList.remove('is-done');
                checkBtn.innerHTML = '';
                checkBtn.setAttribute('aria-label', 'Check ' + escapeHtml(habit.name));
            } else {
                habit.done = true;
                if (habit.dates.indexOf(todayStr) === -1) {
                    habit.dates.push(todayStr);
                    // Calculate streak
                    var streak = 0;
                    var d = new Date();
                    while (true) {
                        var ds = d.toISOString().split('T')[0];
                        if (habit.dates.indexOf(ds) !== -1) {
                            streak++;
                            d.setDate(d.getDate() - 1);
                        } else {
                            break;
                        }
                    }
                    habit.streak = streak;
                }
                checkBtn.classList.add('is-done');
                checkBtn.innerHTML = '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                checkBtn.setAttribute('aria-label', 'Uncheck ' + habit.name);
            }
            renderHabits();
            showToast({ title: habit.done ? 'Habit checked!' : 'Habit unchecked', type: habit.done ? 'success' : 'info' });
        });

        return el;
    }

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            openModal('modal-habit', addBtn);
        });
    }

    var habitForm = document.getElementById('habit-form');
    if (habitForm) {
        habitForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var nameInput = document.getElementById('habit-name-input');
            var iconInput = document.getElementById('habit-icon-input');
            var name = nameInput ? nameInput.value.trim() : '';
            var icon = iconInput ? iconInput.value : '🎯';
            if (!name) return;
            appState.data.habits.push({
                id: generateId(),
                name: name,
                icon: icon,
                streak: 0,
                done: false,
                dates: []
            });
            renderHabits();
            closeModal(document.getElementById('modal-habit'));
            if (nameInput) nameInput.value = '';
            showToast({ title: 'Habit created!', type: 'success' });
        });
    }

    renderHabits();
}

// ═══════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════
function initHealth(appState) {
    var form = document.getElementById('health-form');

    function renderHealth() {
        var h = appState.data.health;
        var steps = document.getElementById('health-steps');
        var water = document.getElementById('health-water');
        var sleep = document.getElementById('health-sleep');
        var mood = document.getElementById('health-mood');

        if (steps) steps.textContent = h.steps || 0;
        if (water) water.textContent = h.water || 0;
        if (sleep) sleep.textContent = h.sleep || 0;
        if (mood) mood.textContent = h.mood || '--';
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var steps = document.getElementById('health-steps-input');
            var water = document.getElementById('health-water-input');
            var sleep = document.getElementById('health-sleep-input');
            var mood = document.getElementById('health-mood-input');

            var health = appState.data.health || {};
            if (steps && steps.value) health.steps = parseInt(steps.value);
            if (water && water.value) health.water = parseInt(water.value);
            if (sleep && sleep.value) health.sleep = parseFloat(sleep.value);
            if (mood && mood.value) health.mood = mood.value;
            appState.data.health = health;

            renderHealth();
            saveData(appState.data);
            showToast({ title: 'Health data saved!', type: 'success' });

            if (steps) steps.value = '';
            if (water) water.value = '';
            if (sleep) sleep.value = '';
            if (mood) mood.value = '';
        });
    }

    renderHealth();
}

// ═══════════════════════════════════════════════════
// GOALS
// ═══════════════════════════════════════════════════
function initGoals(appState) {
    var list = document.getElementById('goal-list');
    var empty = document.getElementById('goals-empty');
    var addBtn = document.getElementById('goal-add-btn');
    var dashGoals = document.getElementById('dashboard-goals-progress');
    var dashLabel = document.getElementById('dashboard-goals-label');

    function renderGoals() {
        var goals = appState.data.goals;

        var totalProgress = 0;
        if (goals.length > 0) {
            var sum = goals.reduce(function (acc, g) {
                return acc + (g.target > 0 ? (g.current / g.target) : 0);
            }, 0);
            totalProgress = Math.round((sum / goals.length) * 100);
        }

        if (dashGoals) dashGoals.textContent = totalProgress + '%';
        if (dashLabel) dashLabel.textContent = goals.length > 0 ? 'overall progress' : 'no goals set';

        if (list) {
            if (goals.length === 0) {
                list.innerHTML = '';
                if (empty) empty.style.display = '';
                list.appendChild(empty);
            } else {
                if (empty) empty.style.display = 'none';
                list.innerHTML = '';
                var fragment = document.createDocumentFragment();
                goals.forEach(function (g) {
                    var el = createGoalElement(g);
                    fragment.appendChild(el);
                });
                list.appendChild(fragment);
            }
        }

        saveData(appState.data);
    }

    function createGoalElement(goal) {
        var pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
        var el = document.createElement('div');
        el.className = 'goal-item';
        el.setAttribute('role', 'listitem');
        el.dataset.id = goal.id;

        el.innerHTML = '<div class="goal-item__header">' +
            '<div class="goal-item__title">' + escapeHtml(goal.title) + '</div>' +
            '<div class="goal-item__progress-text">' + goal.current + ' / ' + goal.target + '</div>' +
            '</div>' +
            '<div class="goal-item__bar">' +
            '<div class="goal-item__bar-fill" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<div class="flex gap-2 mt-2">' +
            '<button type="button" class="btn btn--ghost btn--sm goal-increment" aria-label="Increment ' + escapeHtml(goal.title) + '">+1</button>' +
            '<button type="button" class="btn btn--ghost btn--sm goal-delete" aria-label="Delete goal">Delete</button>' +
            '</div>';

        el.querySelector('.goal-increment').addEventListener('click', function () {
            if (goal.current < goal.target) {
                goal.current++;
                renderGoals();
            }
        });

        el.querySelector('.goal-delete').addEventListener('click', function () {
            appState.data.goals = appState.data.goals.filter(function (g) { return g.id !== goal.id; });
            renderGoals();
            showToast({ title: 'Goal deleted', type: 'info' });
        });

        return el;
    }

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            openModal('modal-goal', addBtn);
        });
    }

    var goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var title = document.getElementById('goal-title-input');
            var target = document.getElementById('goal-target-input');
            var current = document.getElementById('goal-current-input');
            if (!title || !target) return;
            var t = title.value.trim();
            var tg = parseInt(target.value);
            var cur = current ? parseInt(current.value) || 0 : 0;
            if (!t || !tg) return;
            appState.data.goals.push({
                id: generateId(),
                title: t,
                target: tg,
                current: cur
            });
            renderGoals();
            closeModal(document.getElementById('modal-goal'));
            title.value = '';
            target.value = '';
            if (current) current.value = '0';
            showToast({ title: 'Goal created!', type: 'success' });
        });
    }

    renderGoals();
}

// ═══════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════
function initCalendar(appState) {
    var grid = document.getElementById('cal-grid');
    var monthLabel = document.getElementById('cal-month');
    var prevBtn = document.getElementById('cal-prev');
    var nextBtn = document.getElementById('cal-next');
    var eventList = document.getElementById('event-list');
    var eventsEmpty = document.getElementById('events-empty');
    var addBtn = document.getElementById('event-add-btn');
    var dashCount = document.getElementById('dashboard-calendar-count');

    var calState = { month: new Date().getMonth(), year: new Date().getFullYear() };
    var todayStr = today();

    function renderCalendar() {
        var m = calState.month;
        var y = calState.year;
        var firstDay = firstDayOfMonth(m, y);
        var days = daysInMonth(m, y);
        var prevDays = daysInMonth(m - 1 < 0 ? 11 : m - 1, m - 1 < 0 ? y - 1 : y);

        if (monthLabel) monthLabel.textContent = getMonthName(m) + ' ' + y;

        // Build grid
        var cells = [];
        // Previous month days
        for (var i = firstDay - 1; i >= 0; i--) {
            cells.push({ day: prevDays - i, other: true });
        }
        // Current month days
        for (var i = 1; i <= days; i++) {
            cells.push({ day: i, other: false });
        }
        // Next month days
        var remaining = 42 - cells.length;
        for (var i = 1; i <= remaining; i++) {
            cells.push({ day: i, other: true });
        }

        if (grid) {
            // Keep day headers
            var headers = grid.querySelectorAll('.calendar__day-header');
            grid.innerHTML = '';
            headers.forEach(function (h) { grid.appendChild(h); });

            cells.forEach(function (c) {
                var el = document.createElement('button');
                el.type = 'button';
                el.className = 'calendar__day';
                if (c.other) el.classList.add('is-other-month');

                var dateStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(c.day).padStart(2, '0');
                if (dateStr === todayStr && !c.other) el.classList.add('is-today');

                // Check for events
                var hasEvent = appState.data.events.some(function (e) { return e.date === dateStr; });
                if (hasEvent && !c.other) {
                    el.classList.add('calendar__day--has-event');
                }

                el.textContent = c.day;
                el.setAttribute('aria-label', getMonthName(m) + ' ' + c.day + ', ' + y);
                grid.appendChild(el);
            });
        }

        renderEvents();
    }

    function renderEvents() {
        var m = calState.month;
        var y = calState.year;
        var events = appState.data.events.filter(function (e) {
            var d = new Date(e.date + 'T00:00:00');
            return d.getMonth() === m && d.getFullYear() === y;
        }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });

        if (dashCount) dashCount.textContent = events.length;

        if (eventList) {
            if (events.length === 0) {
                eventList.innerHTML = '';
                if (eventsEmpty) eventsEmpty.style.display = '';
                eventList.appendChild(eventsEmpty);
            } else {
                if (eventsEmpty) eventsEmpty.style.display = 'none';
                eventList.innerHTML = '';
                var frag = document.createDocumentFragment();
                events.forEach(function (ev) {
                    var el = document.createElement('div');
                    el.className = 'event-list-item';
                    el.innerHTML = '<div class="event-list-item__info"><div class="event-list-item__title">' + escapeHtml(ev.title) + '</div><div class="event-list-item__meta">' + formatDate(ev.date) + '</div></div>' +
                        '<button type="button" class="btn btn--icon btn--ghost btn--sm event-delete" aria-label="Delete event">' +
                        '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
                    el.querySelector('.event-delete').addEventListener('click', function () {
                        appState.data.events = appState.data.events.filter(function (e) { return e.id !== ev.id; });
                        renderCalendar();
                        saveData(appState.data);
                        showToast({ title: 'Event deleted', type: 'info' });
                    });
                    frag.appendChild(el);
                });
                eventList.appendChild(frag);
            }
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            calState.month--;
            if (calState.month < 0) { calState.month = 11; calState.year--; }
            renderCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            calState.month++;
            if (calState.month > 11) { calState.month = 0; calState.year++; }
            renderCalendar();
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            var dateInput = document.getElementById('event-date-input');
            if (dateInput) dateInput.value = todayStr;
            openModal('modal-event', addBtn);
        });
    }

    var eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var title = document.getElementById('event-title-input');
            var date = document.getElementById('event-date-input');
            if (!title || !date) return;
            var t = title.value.trim();
            var d = date.value;
            if (!t || !d) return;
            appState.data.events.push({
                id: generateId(),
                title: t,
                date: d
            });
            renderCalendar();
            closeModal(document.getElementById('modal-event'));
            title.value = '';
            date.value = '';
            showToast({ title: 'Event added!', type: 'success' });
        });
    }

    renderCalendar();
}

// ═══════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════
function initNotes(appState) {
    var grid = document.getElementById('note-grid');
    var empty = document.getElementById('notes-empty');
    var addBtn = document.getElementById('note-add-btn');
    var dashCount = document.getElementById('dashboard-notes-count');

    function renderNotes() {
        var notes = appState.data.notes;

        if (dashCount) dashCount.textContent = notes.length;

        if (grid) {
            grid.innerHTML = '';
            if (notes.length === 0) {
                if (empty) empty.style.display = '';
                grid.appendChild(empty);
            } else {
                if (empty) empty.style.display = 'none';
                var frag = document.createDocumentFragment();
                notes.forEach(function (n) {
                    var el = document.createElement('div');
                    el.className = 'note-card';
                    el.setAttribute('role', 'listitem');
                    el.innerHTML = '<div class="note-card__title">' + escapeHtml(n.title) + '</div>' +
                        '<div class="note-card__preview">' + escapeHtml(n.content || '') + '</div>' +
                        '<div class="note-card__date">' + formatDate(n.created.split('T')[0]) +
                        ' <button type="button" class="note-delete btn btn--ghost btn--sm text-xs" aria-label="Delete note">Delete</button></div>';
                    el.querySelector('.note-delete').addEventListener('click', function () {
                        appState.data.notes = appState.data.notes.filter(function (x) { return x.id !== n.id; });
                        renderNotes();
                        saveData(appState.data);
                        showToast({ title: 'Note deleted', type: 'info' });
                    });
                    frag.appendChild(el);
                });
                grid.appendChild(frag);
            }
        }
    }

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            openModal('modal-note', addBtn);
        });
    }

    var noteForm = document.getElementById('note-form');
    if (noteForm) {
        noteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var title = document.getElementById('note-title-input');
            var content = document.getElementById('note-content-input');
            if (!title) return;
            var t = title.value.trim();
            if (!t) return;
            appState.data.notes.push({
                id: generateId(),
                title: t,
                content: content ? content.value.trim() : '',
                created: new Date().toISOString()
            });
            renderNotes();
            closeModal(document.getElementById('modal-note'));
            title.value = '';
            if (content) content.value = '';
            showToast({ title: 'Note saved!', type: 'success' });
        });
    }

    renderNotes();
}

// ═══════════════════════════════════════════════════
// FINANCES
// ═══════════════════════════════════════════════════
function initFinances(appState) {
    var expenseList = document.getElementById('expense-list');
    var expensesEmpty = document.getElementById('expenses-empty');
    var addBtn = document.getElementById('expense-add-btn');
    var dashRemaining = document.getElementById('dashboard-budget-remaining');
    var dashLabel = document.getElementById('dashboard-budget-label');

    function renderFinances() {
        var fin = appState.data.finances;
        var calc = calcBudget(fin);
        var budget = calc.budget, spent = calc.spent, remaining = calc.remaining, pct = calc.pct;

        var budgetEl = document.getElementById('finance-budget');
        var spentEl = document.getElementById('finance-spent');
        var remainingEl = document.getElementById('finance-remaining');
        var progressEl = document.getElementById('finance-progress');

        if (budgetEl) budgetEl.textContent = '$' + budget.toLocaleString();
        if (spentEl) spentEl.textContent = '$' + spent.toLocaleString();
        if (remainingEl) remainingEl.textContent = '$' + Math.max(0, remaining).toLocaleString();
        if (progressEl) progressEl.style.width = pct + '%';

        if (dashRemaining) dashRemaining.textContent = '$' + Math.max(0, remaining).toLocaleString();
        if (dashLabel) dashLabel.textContent = 'remaining this month';

        // Expense list
        if (expenseList) {
            var expenses = fin.expenses.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
            if (expenses.length === 0) {
                expenseList.innerHTML = '';
                if (expensesEmpty) expensesEmpty.style.display = '';
                expenseList.appendChild(expensesEmpty);
            } else {
                if (expensesEmpty) expensesEmpty.style.display = 'none';
                expenseList.innerHTML = '';
                var frag = document.createDocumentFragment();
                expenses.forEach(function (ex) {
                    var el = document.createElement('div');
                    el.className = 'finance-item';
                    el.innerHTML = '<div class="finance-item__info"><div class="finance-item__label">' + escapeHtml(ex.label) + '</div><div class="finance-item__date">' + formatDate(ex.date) + '</div></div>' +
                        '<div class="finance-item__amount finance-item__amount--negative">-$' + ex.amount.toFixed(2) + '</div>' +
                        '<button type="button" class="btn btn--icon btn--ghost btn--sm expense-delete" aria-label="Delete expense">' +
                        '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
                    el.querySelector('.expense-delete').addEventListener('click', function () {
                        fin.expenses = fin.expenses.filter(function (x) { return x.id !== ex.id; });
                        renderFinances();
                        saveData(appState.data);
                        showToast({ title: 'Expense deleted', type: 'info' });
                    });
                    frag.appendChild(el);
                });
                expenseList.appendChild(frag);
            }
        }

        saveData(appState.data);
    }

    // Budget form
    var budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = document.getElementById('budget-input');
            if (input) {
                var val = parseInt(input.value);
                if (val > 0) {
                    appState.data.finances.budget = val;
                    renderFinances();
                    showToast({ title: 'Budget updated to $' + val.toLocaleString(), type: 'success' });
                }
            }
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', function () {
            openModal('modal-expense', addBtn);
        });
    }

    var expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var label = document.getElementById('expense-label-input');
            var amount = document.getElementById('expense-amount-input');
            if (!label || !amount) return;
            var l = label.value.trim();
            var a = parseFloat(amount.value);
            if (!l || !a || a <= 0) return;
            appState.data.finances.expenses.push({
                id: generateId(),
                label: l,
                amount: a,
                date: today()
            });
            renderFinances();
            closeModal(document.getElementById('modal-expense'));
            label.value = '';
            amount.value = '';
            showToast({ title: 'Expense added!', type: 'success' });
        });
    }

    renderFinances();
}

// ═══════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════
function initSearch(appState) {
    var overlay = document.getElementById('search-overlay');
    var input = document.getElementById('search-overlay-input');
    var results = document.getElementById('search-overlay-results');
    var closeBtn = document.getElementById('search-overlay-close');

    if (!overlay || !input) return;

    function performSearch(query) {
        query = query.toLowerCase().trim();
        if (!results) return;
        if (!query) {
            results.innerHTML = '<div class="text-sm text-muted p-4 text-center">Type to search tasks and notes...</div>';
            return;
        }

        var items = [];

        // Search tasks
        (appState.data.tasks || []).forEach(function (t) {
            if (t.text.toLowerCase().indexOf(query) !== -1) {
                items.push({ title: t.text, desc: 'Task', icon: '✓', section: 'tasks' });
            }
        });

        // Search notes
        (appState.data.notes || []).forEach(function (n) {
            if (n.title.toLowerCase().indexOf(query) !== -1 || (n.content && n.content.toLowerCase().indexOf(query) !== -1)) {
                items.push({ title: n.title, desc: 'Note', icon: '✎', section: 'notes' });
            }
        });

        if (items.length === 0) {
            results.innerHTML = '<div class="text-sm text-muted p-4 text-center">No results found</div>';
            return;
        }

        results.innerHTML = '';
        items.slice(0, 8).forEach(function (item) {
            var el = document.createElement('div');
            el.className = 'search-overlay__result-item';
            el.setAttribute('role', 'option');
            el.setAttribute('tabindex', '-1');
            el.innerHTML = '<div class="search-overlay__result-icon" aria-hidden="true">' + item.icon + '</div>' +
                '<div class="search-overlay__result-info"><div class="search-overlay__result-title">' + escapeHtml(item.title) + '</div><div class="search-overlay__result-desc">' + item.desc + '</div></div>';
            el.addEventListener('click', function () {
                overlay.hidden = true;
                // Navigate to section
                var link = document.querySelector('[data-section="' + item.section + '"]');
                if (link) link.click();
            });
            results.appendChild(el);
        });
    }

    input.addEventListener('input', debounce(function () {
        performSearch(input.value);
    }, 200));

    // Keyboard shortcuts
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            overlay.hidden = true;
        }
        if (e.key === 'Enter') {
            var first = results.querySelector('.search-overlay__result-item');
            if (first) first.click();
        }
    });

    // Global keyboard shortcut: Ctrl+K or Cmd+K
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            overlay._trigger = document.activeElement;
            overlay.hidden = false;
            input.value = '';
            input.focus();
            performSearch('');
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            overlay.hidden = true;
        });
    }

    // Focus trap + Escape to close
    overlay.addEventListener('keydown', function (e) {
        trapFocus(overlay, e);
    });
}

// ═══════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════
function updateDashboardStats(appState) {
    var data = appState.data;
    // Tasks
    var tasksTotal = document.getElementById('dashboard-tasks-total');
    if (tasksTotal) tasksTotal.textContent = data.tasks.length;

    // Habits
    var todayStr = today();
    var doneToday = data.habits.filter(function (h) { return h.dates.indexOf(todayStr) !== -1; }).length;
    var dashDone = document.getElementById('dashboard-habits-done');
    if (dashDone) dashDone.textContent = doneToday + '/' + data.habits.length;

    // Goals
    var goals = data.goals;
    var totalPct = 0;
    if (goals.length > 0) {
        var sum = goals.reduce(function (acc, g) {
            return acc + (g.target > 0 ? (g.current / g.target) : 0);
        }, 0);
        totalPct = Math.round((sum / goals.length) * 100);
    }
    var dashGoals = document.getElementById('dashboard-goals-progress');
    if (dashGoals) dashGoals.textContent = totalPct + '%';

    // Budget
    var calc = calcBudget(data.finances);
    var dashRemaining = document.getElementById('dashboard-budget-remaining');
    if (dashRemaining) dashRemaining.textContent = '$' + Math.max(0, calc.remaining).toLocaleString();

    // Notes
    var notesCount = document.getElementById('dashboard-notes-count');
    if (notesCount) notesCount.textContent = data.notes.length;

    // Events this month
    var now = new Date();
    var monthEvents = data.events.filter(function (e) {
        var d = new Date(e.date + 'T00:00:00');
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    var calCount = document.getElementById('dashboard-calendar-count');
    if (calCount) calCount.textContent = monthEvents.length;

    updateDashboardStreak(appState);
}

function updateDashboardStreak(appState) {
    var streakEl = document.getElementById('dashboard-streak');
    if (!streakEl) return;
    var maxStreak = 0;
    appState.data.habits.forEach(function (h) {
        if (h.streak > maxStreak) maxStreak = h.streak;
    });
    streakEl.textContent = maxStreak;
}

// ═══════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════
function initSettings(appState) {
    var themeToggle = document.getElementById('settings-theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var current = getThemePreference();
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
        themeToggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                themeToggle.click();
            }
        });
    }

    var exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            try {
                var blob = new Blob([JSON.stringify(appState.data, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'lifehub-backup-' + today() + '.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast({ title: 'Data exported successfully', type: 'success' });
            } catch (e) {
                showToast({ title: 'Export failed', message: e.message, type: 'error', duration: 0 });
            }
        });
    }

    var clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            var modal = document.getElementById('modal-confirm');
            var confirmBtn = document.getElementById('confirm-action');
            if (modal && confirmBtn) {
                var handler = function () {
                    confirmBtn.removeEventListener('click', handler);
                    appState.data = getDefaultData();
                    appState.data.onboardingDone = true;
                    saveData(appState.data);
                    location.reload();
                };
                confirmBtn.addEventListener('click', handler, { once: true });
                openModal('modal-confirm', clearBtn);
            }
        });
    }
}

// ═══════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════
function initOnboarding(appState) {
    if (appState.data.onboardingDone) return;

    var overlay = document.createElement('div');
    overlay.className = 'onboarding';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'onboarding-title');
    overlay.innerHTML =
        '<div class="onboarding__container">' +
        '<div class="onboarding__icon" aria-hidden="true">LH</div>' +
        '<h2 class="onboarding__title" id="onboarding-title">Welcome to LifeHUB</h2>' +
        '<p class="onboarding__description">Your all-in-one personal dashboard. Organize every area of your life from one place.</p>' +
        '<div class="onboarding__features">' +
        '<div class="onboarding__feature"><span class="onboarding__feature-icon">✓</span><span class="onboarding__feature-text">Track tasks and daily habits</span></div>' +
        '<div class="onboarding__feature"><span class="onboarding__feature-icon">✓</span><span class="onboarding__feature-text">Monitor health and wellness metrics</span></div>' +
        '<div class="onboarding__feature"><span class="onboarding__feature-icon">✓</span><span class="onboarding__feature-text">Set and track personal goals</span></div>' +
        '<div class="onboarding__feature"><span class="onboarding__feature-icon">✓</span><span class="onboarding__feature-text">Manage finances and budget</span></div>' +
        '</div>' +
        '<button type="button" class="btn btn--primary btn--lg" id="onboarding-start">Get Started</button>' +
        '</div>';

    document.body.appendChild(overlay);

    document.getElementById('onboarding-start').addEventListener('click', function () {
        overlay.remove();
        appState.data.onboardingDone = true;
        saveData(appState.data);
    });
}