// ── Intersection Observer for staggered animations ──
function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
        observer.observe(el);
    });
}

// ── Counter animation ───────────────────────────
function animateCounter(el, target, duration) {
    if (!el) return;
    var start = 0;
    var step = Math.max(1, Math.floor(target / 30));
    var increment = function () {
        start += step;
        if (start >= target) {
            el.textContent = target;
            return;
        }
        el.textContent = start;
        requestAnimationFrame(increment);
    };
    increment();
}

// ── Modal focus trap ────────────────────────────
function trapFocus(modalEl, e) {
    var focusable = modalEl.querySelectorAll('a[href], button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
    if (e.key === 'Escape') closeModal(modalEl);
}

// ── Modal helpers ───────────────────────────────
function openModal(modalId, triggerEl) {
    var modal = document.getElementById(modalId);
    if (!modal) return;
    modal.hidden = false;
    modal._trigger = triggerEl;
    document.body.style.overflow = 'hidden';

    var focusable = modal.querySelectorAll('a[href], button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), textarea:not([disabled]):not([hidden]), select:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) focusable[0].focus();

    if (modal._keydownHandler) modal.removeEventListener('keydown', modal._keydownHandler);
    modal._keydownHandler = function handler(e) {
        trapFocus(modal, e);
    };
    modal.addEventListener('keydown', modal._keydownHandler);
}

function closeModal(modalEl) {
    modalEl.hidden = true;
    document.body.style.overflow = '';
    if (modalEl._keydownHandler) {
        modalEl.removeEventListener('keydown', modalEl._keydownHandler);
        modalEl._keydownHandler = null;
    }
    if (modalEl._trigger) {
        modalEl._trigger.focus();
        modalEl._trigger = null;
    }
}

function initModals() {
    document.querySelectorAll('[data-modal-close]').forEach(function (el) {
        el.addEventListener('click', function () {
            var modal = el.closest('.modal');
            if (modal) closeModal(modal);
        });
    });
}