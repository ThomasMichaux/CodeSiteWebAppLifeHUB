// ── Constants ────────────────────────────────────

// ── Sidebar Navigation ───────────────────────────
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuBtn = document.getElementById('menu-toggle');

    if (!sidebar || !overlay || !menuBtn) return;

    function openSidebar() {
        sidebar.classList.add('is-open');
        overlay.classList.add('is-visible');
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.setAttribute('aria-label', 'Close navigation menu');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.remove('is-open');
        overlay.classList.remove('is-visible');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open navigation menu');
        document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', function () {
        if (sidebar.classList.contains('is-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    // Close on Escape
    function onSidebarKeydown(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('is-open') && window.innerWidth < 768) {
            closeSidebar();
        }
    }
    document.addEventListener('keydown', onSidebarKeydown);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('[data-section]').forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    // Reset on resize (debounced)
    window.addEventListener('resize', debounce(function () {
        if (window.innerWidth >= 768) {
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-visible');
            document.body.style.overflow = '';
        }
    }, 100));
}

// ── Section Navigation ──────────────────────────
function initNavigation(appState) {
    const navLinks = document.querySelectorAll('[data-section]');
    const pageTitle = document.getElementById('page-title');

    function navigateTo(sectionId) {
        // Update sidebar links
        navLinks.forEach(function (link) {
            const sec = link.getAttribute('data-section');
            if (sec === sectionId) {
                link.classList.add('is-active');
                if (link.tagName === 'A') {
                    link.setAttribute('aria-current', 'page');
                }
            } else {
                link.classList.remove('is-active');
                if (link.tagName === 'A') {
                    link.removeAttribute('aria-current');
                }
            }
        });

        // Show/hide sections
        document.querySelectorAll('.dashboard-section').forEach(function (section) {
            section.classList.remove('is-active');
        });
        var target = document.getElementById('section-' + sectionId);
        if (target) {
            target.classList.add('is-active');
            target.style.animation = 'none';
            target.offsetHeight;
            target.style.animation = '';
        }

        // Update page title
        var titles = {
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
        if (pageTitle) pageTitle.textContent = titles[sectionId] || 'Dashboard';

        // Update app state
        if (appState) appState.currentSection = sectionId;
    }

    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var section = link.getAttribute('data-section');
            if (section) navigateTo(section);
        });
    });
}

// ── Search Toggle (mobile) ───────────────────────
function initSearchToggle() {
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchInput = document.getElementById('search-overlay-input');

    if (!searchToggle || !searchOverlay) return;

    searchToggle.addEventListener('click', function () {
        searchOverlay._trigger = searchToggle;
        searchOverlay.hidden = false;
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    });
}

// ── Header Search ────────────────────────────────
function initHeaderSearch(appState) {
    const headerSearch = document.getElementById('global-search');
    if (!headerSearch) return;

    headerSearch.addEventListener('focus', function () {
        const overlay = document.getElementById('search-overlay');
        if (overlay) {
            overlay.hidden = false;
            const input = document.getElementById('search-overlay-input');
            if (input) {
                input.value = headerSearch.value;
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    });
}