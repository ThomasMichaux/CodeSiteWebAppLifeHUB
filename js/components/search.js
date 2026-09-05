import { debounce, escapeHtml, formatDate } from '../utilities.js';
import { closeModal, openModal } from '../animations.js';
import { goToSection } from '../layout.js';

const MAX_RESULTS = 8;
const HINT = '<div class="text-sm text-muted p-4 text-center">Type to search tasks, notes, goals, events and expenses.</div>';
const NO_RESULTS = '<div class="text-sm text-muted p-4 text-center">No results found</div>';

export function initSearch(appState) {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-overlay-input');
    const results = document.getElementById('search-overlay-results');
    const backdrop = document.getElementById('search-overlay-close');
    const headerSearch = document.getElementById('global-search');
    const searchToggle = document.getElementById('search-toggle');

    if (!overlay || !input || !results) return;

    let matches = [];
    let activeIndex = -1;

    function collectMatches(query) {
        const data = appState.data;
        const found = [];

        data.tasks.forEach((task) => {
            if (task.text.toLowerCase().includes(query)) {
                found.push({ title: task.text, desc: task.done ? 'Task · completed' : 'Task', icon: '✓', section: 'tasks' });
            }
        });

        data.notes.forEach((note) => {
            if (note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)) {
                found.push({ title: note.title, desc: 'Note', icon: '✎', section: 'notes' });
            }
        });

        data.goals.forEach((goal) => {
            if (goal.title.toLowerCase().includes(query)) {
                found.push({ title: goal.title, desc: `Goal · ${goal.current} of ${goal.target}`, icon: '◎', section: 'goals' });
            }
        });

        data.events.forEach((event) => {
            if (event.title.toLowerCase().includes(query)) {
                found.push({ title: event.title, desc: 'Event · ' + formatDate(event.date), icon: '▤', section: 'calendar' });
            }
        });

        data.finances.expenses.forEach((expense) => {
            if (expense.label.toLowerCase().includes(query)) {
                found.push({ title: expense.label, desc: 'Expense · $' + expense.amount.toFixed(2), icon: '$', section: 'finances' });
            }
        });

        return found;
    }

    function setActive(index) {
        const nodes = results.querySelectorAll('.search-overlay__result-item');
        if (nodes.length === 0) return;

        activeIndex = (index + nodes.length) % nodes.length;
        nodes.forEach((node, position) => {
            const isActive = position === activeIndex;
            node.classList.toggle('is-active', isActive);
            node.setAttribute('aria-selected', String(isActive));
            if (isActive) {
                input.setAttribute('aria-activedescendant', node.id);
                node.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function performSearch(rawQuery) {
        const query = rawQuery.toLowerCase().trim();
        activeIndex = -1;
        input.removeAttribute('aria-activedescendant');

        if (!query) {
            matches = [];
            results.innerHTML = HINT;
            input.setAttribute('aria-expanded', 'false');
            return;
        }

        matches = collectMatches(query).slice(0, MAX_RESULTS);
        if (matches.length === 0) {
            results.innerHTML = NO_RESULTS;
            input.setAttribute('aria-expanded', 'false');
            return;
        }

        results.innerHTML = '';
        matches.forEach((match, index) => {
            const el = document.createElement('div');
            el.className = 'search-overlay__result-item';
            el.id = 'search-result-' + index;
            el.setAttribute('role', 'option');
            el.setAttribute('aria-selected', 'false');
            el.innerHTML = `
                <div class="search-overlay__result-icon" aria-hidden="true">${escapeHtml(match.icon)}</div>
                <div class="search-overlay__result-info">
                    <div class="search-overlay__result-title">${escapeHtml(match.title)}</div>
                    <div class="search-overlay__result-desc">${escapeHtml(match.desc)}</div>
                </div>`;
            el.addEventListener('click', () => activate(index));
            results.appendChild(el);
        });

        input.setAttribute('aria-expanded', 'true');
    }

    function activate(index) {
        const match = matches[index];
        if (!match) return;
        closeModal(overlay);
        goToSection(match.section);
    }

    function openSearch(trigger, initialQuery) {
        openModal('search-overlay', trigger);
        input.value = initialQuery || '';
        input.focus();
        performSearch(input.value);
    }

    input.addEventListener('input', debounce(() => performSearch(input.value), 200));

    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive(activeIndex + 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(activeIndex - 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            activate(activeIndex === -1 ? 0 : activeIndex);
        }
    });

    if (backdrop) backdrop.addEventListener('click', () => closeModal(overlay));
    if (headerSearch) headerSearch.addEventListener('click', () => openSearch(headerSearch));
    if (searchToggle) searchToggle.addEventListener('click', () => openSearch(searchToggle));

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            openSearch(document.activeElement);
        }
    });
}