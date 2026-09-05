const FOCUSABLE = 'a[href]:not([hidden]), button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])';

let scrollLocks = 0;
let pendingConfirm = null;

export function lockScroll() {
    scrollLocks++;
    document.body.style.overflow = 'hidden';
}

export function unlockScroll() {
    scrollLocks = Math.max(0, scrollLocks - 1);
    if (scrollLocks === 0) document.body.style.overflow = '';
}

function focusableWithin(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE));
}

export function cycleFocus(container, e) {
    if (e.key !== 'Tab') return;
    const focusable = focusableWithin(container);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
}

function trapFocus(modalEl, e) {
    cycleFocus(modalEl, e);
    if (e.key === 'Escape') closeModal(modalEl);
}

export function openModal(modalId, triggerEl) {
    const modal = document.getElementById(modalId);
    if (!modal || !modal.hidden) return modal;

    modal.hidden = false;
    modal._trigger = triggerEl || null;
    lockScroll();

    const focusable = focusableWithin(modal);
    if (focusable.length > 0) focusable[0].focus();

    modal._keydownHandler = (e) => trapFocus(modal, e);
    modal.addEventListener('keydown', modal._keydownHandler);
    return modal;
}

export function closeModal(modalEl) {
    if (!modalEl || modalEl.hidden) return;
    if (modalEl.id === 'modal-confirm') pendingConfirm = null;

    modalEl.hidden = true;
    unlockScroll();

    if (modalEl._keydownHandler) {
        modalEl.removeEventListener('keydown', modalEl._keydownHandler);
        modalEl._keydownHandler = null;
    }
    if (modalEl._trigger) {
        modalEl._trigger.focus();
        modalEl._trigger = null;
    }
}

export function confirmAction({ title, message, confirmLabel, onConfirm, trigger }) {
    const modal = document.getElementById('modal-confirm');
    if (!modal) return;

    const titleEl = document.getElementById('modal-confirm-title');
    const descEl = document.getElementById('modal-confirm-desc');
    const confirmBtn = document.getElementById('confirm-action');

    if (titleEl) titleEl.textContent = title || 'Confirm';
    if (descEl) descEl.textContent = message || 'Are you sure? This action cannot be undone.';
    if (confirmBtn) confirmBtn.textContent = confirmLabel || 'Confirm';

    openModal('modal-confirm', trigger);
    pendingConfirm = onConfirm;
}

export function initModals() {
    document.querySelectorAll('[data-modal-close]').forEach((el) => {
        el.addEventListener('click', () => {
            const modal = el.closest('.modal');
            if (modal) closeModal(modal);
        });
    });

    const confirmBtn = document.getElementById('confirm-action');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const action = pendingConfirm;
            const modal = document.getElementById('modal-confirm');
            if (modal) closeModal(modal);
            if (action) action();
        });
    }
}