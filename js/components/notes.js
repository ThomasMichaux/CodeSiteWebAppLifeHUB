import { clearFieldErrors, escapeHtml, formatTimestamp, generateId, saveData, setFieldError, showToast } from '../utilities.js';
import { closeModal, openModal } from '../animations.js';
import { updateDashboardStats } from './dashboard.js';

export function initNotes(appState) {
    const grid = document.getElementById('note-grid');
    const empty = document.getElementById('notes-empty');
    const addBtn = document.getElementById('note-add-btn');
    const form = document.getElementById('note-form');
    const modalTitle = document.getElementById('modal-note-title');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

    let editingId = null;

    function commit() {
        saveData(appState.data);
        renderNotes();
        updateDashboardStats(appState);
    }

    function openEditor(note, trigger) {
        clearFieldErrors(form);
        editingId = note ? note.id : null;

        if (modalTitle) modalTitle.textContent = note ? 'Edit Note' : 'New Note';
        if (submitBtn) submitBtn.textContent = note ? 'Save Changes' : 'Save Note';
        if (titleInput) titleInput.value = note ? note.title : '';
        if (contentInput) contentInput.value = note ? note.content : '';

        openModal('modal-note', trigger);
    }

    function renderNotes() {
        const notes = appState.data.notes;
        if (!grid) return;

        grid.innerHTML = '';
        if (notes.length === 0) {
            if (empty) {
                empty.style.display = '';
                grid.appendChild(empty);
            }
            return;
        }

        if (empty) empty.style.display = 'none';
        const fragment = document.createDocumentFragment();
        notes.forEach((note) => fragment.appendChild(createNoteElement(note)));
        grid.appendChild(fragment);
    }

    function createNoteElement(note) {
        const el = document.createElement('div');
        el.className = 'note-card';
        el.setAttribute('role', 'listitem');
        el.dataset.id = note.id;

        const created = formatTimestamp(note.created);
        el.innerHTML = `
            <button type="button" class="note-card__open" aria-label="Edit note ${escapeHtml(note.title)}">
                <span class="note-card__title">${escapeHtml(note.title)}</span>
                <span class="note-card__preview">${escapeHtml(note.content)}</span>
            </button>
            <div class="note-card__footer">
                <span class="note-card__date">${created}</span>
                <button type="button" class="note-delete btn btn--ghost btn--sm text-xs" aria-label="Delete note ${escapeHtml(note.title)}">Delete</button>
            </div>`;

        const openBtn = el.querySelector('.note-card__open');
        openBtn.addEventListener('click', () => openEditor(note, openBtn));

        el.querySelector('.note-delete').addEventListener('click', () => {
            appState.data.notes = appState.data.notes.filter((entry) => entry.id !== note.id);
            commit();
            showToast({ title: 'Note deleted', type: 'info' });
        });

        return el;
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => openEditor(null, addBtn));
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!titleInput) return;
            clearFieldErrors(form);

            const title = titleInput.value.trim();
            if (!title) {
                setFieldError(titleInput, 'Give this note a title.');
                titleInput.focus();
                return;
            }

            const content = contentInput ? contentInput.value.trim() : '';
            const existing = editingId ? appState.data.notes.find((note) => note.id === editingId) : null;

            if (existing) {
                existing.title = title;
                existing.content = content;
            } else {
                appState.data.notes.push({
                    id: generateId(),
                    title,
                    content,
                    created: new Date().toISOString()
                });
            }

            const savedId = existing ? existing.id : appState.data.notes[appState.data.notes.length - 1].id;
            commit();
            closeModal(document.getElementById('modal-note'));
            form.reset();
            showToast({ title: existing ? 'Note updated!' : 'Note saved!', type: 'success' });
            editingId = null;

            if (existing && grid) {
                const refreshed = grid.querySelector(`[data-id="${savedId}"] .note-card__open`);
                if (refreshed) refreshed.focus();
            }
        });
    }

    renderNotes();
}