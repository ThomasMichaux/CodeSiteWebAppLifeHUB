import { escapeHtml, saveData } from '../utilities.js';
import { cycleFocus, lockScroll, unlockScroll } from '../animations.js';

const FEATURES = [
    'Track tasks and daily habits',
    'Monitor health and wellness metrics',
    'Set and track personal goals',
    'Manage finances and budget'
];

export function initOnboarding(appState) {
    if (appState.data.onboardingDone) return;

    const app = document.getElementById('app');
    const overlay = document.createElement('div');

    overlay.className = 'onboarding';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'onboarding-title');
    overlay.innerHTML = `
        <div class="onboarding__container">
            <div class="onboarding__icon" aria-hidden="true">LH</div>
            <h2 class="onboarding__title" id="onboarding-title">Welcome to LifeHUB</h2>
            <p class="onboarding__description">Your all-in-one personal dashboard. Organize every area of your life from one place.</p>
            <div class="onboarding__features">
                ${FEATURES.map((text) => `
                <div class="onboarding__feature">
                    <span class="onboarding__feature-icon" aria-hidden="true">✓</span>
                    <span class="onboarding__feature-text">${escapeHtml(text)}</span>
                </div>`).join('')}
            </div>
            <button type="button" class="btn btn--primary btn--lg" id="onboarding-start">Get Started</button>
        </div>`;

    document.body.appendChild(overlay);
    if (app) app.inert = true;
    lockScroll();

    const startBtn = overlay.querySelector('#onboarding-start');
    startBtn.focus();

    overlay.addEventListener('keydown', (e) => cycleFocus(overlay, e));

    startBtn.addEventListener('click', () => {
        overlay.remove();
        if (app) app.inert = false;
        unlockScroll();

        appState.data.onboardingDone = true;
        saveData(appState.data);

        const main = document.getElementById('main-content');
        if (main) main.focus();
    });
}