import { debounce } from './utilities.js';
import { cycleFocus, lockScroll, unlockScroll } from './animations.js';

const SECTION_TITLES = {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    habits: 'Habits',
    health: 'Health',
    goals: 'Goals',
    calendar: 'Calendar',
    notes: 'Notes',
    finances: 'Finances',
    settings: 'Settings'
};

const MOBILE_BREAKPOINT = 768;

let navigate = null;

export function goToSection(sectionId) {
    if (navigate) navigate(sectionId, true);
}

export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('menu-toggle');
    const main = document.getElementById('main-content');

    if (!sidebar || !overlay || !menuBtn) return;

    let keydownHandler = null;

    function isMobile() {
        return window.innerWidth < MOBILE_BREAKPOINT;
    }

    function syncInert() {
        sidebar.inert = isMobile() && !sidebar.classList.contains('is-open');
    }

    function openSidebar() {
        sidebar.inert = false;
        sidebar.classList.add('is-open');
        overlay.classList.add('is-visible');
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.setAttribute('aria-label', 'Close navigation menu');
        if (main) main.inert = true;
        lockScroll();

        const firstLink = sidebar.querySelector('.sidebar__link');
        if (firstLink) firstLink.focus();

        keydownHandler = (e) => {
            cycleFocus(sidebar, e);
            if (e.key === 'Escape') closeSidebar(true);
        };
        sidebar.addEventListener('keydown', keydownHandler);
    }

    function closeSidebar(restoreFocus) {
        if (!sidebar.classList.contains('is-open')) return;

        sidebar.classList.remove('is-open');
        overlay.classList.remove('is-visible');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open navigation menu');
        if (main) main.inert = false;
        unlockScroll();

        if (keydownHandler) {
            sidebar.removeEventListener('keydown', keydownHandler);
            keydownHandler = null;
        }

        if (restoreFocus) menuBtn.focus();
        syncInert();
    }

    menuBtn.addEventListener('click', () => {
        if (sidebar.classList.contains('is-open')) {
            closeSidebar(true);
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', () => closeSidebar(true));

    sidebar.querySelectorAll('[data-section]').forEach((link) => {
        link.addEventListener('click', () => {
            if (isMobile()) closeSidebar(true);
        });
    });

    window.addEventListener('resize', debounce(() => {
        if (!isMobile()) closeSidebar(false);
        syncInert();
    }, 100));

    syncInert();
}

export function initNavigation(appState) {
    const pageTitle = document.getElementById('page-title');
    const navLinks = document.querySelectorAll('#sidebar [data-section]');
    const shortcuts = document.querySelectorAll('[data-nav][data-section]');

    function sectionFromHash() {
        const id = window.location.hash.slice(1);
        return Object.prototype.hasOwnProperty.call(SECTION_TITLES, id) ? id : null;
    }

    function render(sectionId) {
        navLinks.forEach((link) => {
            const isCurrent = link.getAttribute('data-section') === sectionId;
            link.classList.toggle('is-active', isCurrent);
            if (isCurrent) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        document.querySelectorAll('.dashboard-section').forEach((section) => {
            section.classList.toggle('is-active', section.id === 'section-' + sectionId);
        });

        if (pageTitle) pageTitle.textContent = SECTION_TITLES[sectionId];
        document.title = sectionId === 'dashboard'
            ? 'LifeHUB — Personal Dashboard'
            : SECTION_TITLES[sectionId] + ' — LifeHUB';
        appState.currentSection = sectionId;
    }

    navigate = function (sectionId, pushHash) {
        if (!Object.prototype.hasOwnProperty.call(SECTION_TITLES, sectionId)) return;
        if (pushHash && sectionFromHash() !== sectionId) {
            window.location.hash = sectionId;
            return;
        }
        render(sectionId);
    };

    [...navLinks, ...shortcuts].forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) navigate(section, true);
        });
    });

    window.addEventListener('hashchange', () => {
        const section = sectionFromHash();
        if (section) render(section);
    });

    render(sectionFromHash() || 'dashboard');
}