import { applyTheme, getDefaultData, getThemePreference, normalizeData, saveData, showToast, today } from '../utilities.js';
import { confirmAction } from '../animations.js';

export function initSettings(appState) {
    const themeToggle = document.getElementById('settings-theme-toggle');
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const importInput = document.getElementById('import-file');
    const clearBtn = document.getElementById('clear-data');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            applyTheme(getThemePreference() === 'dark' ? 'light' : 'dark', true);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                const blob = new Blob([JSON.stringify(appState.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const filename = 'lifehub-backup-' + today() + '.json';

                link.href = url;
                link.download = filename;
                link.hidden = true;
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    link.remove();
                    URL.revokeObjectURL(url);
                }, 1000);

                showToast({ title: 'Data exported', message: filename, type: 'success' });
            } catch (error) {
                showToast({ title: 'Export failed', message: error.message, type: 'error', duration: 0 });
            }
        });
    }

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());

        importInput.addEventListener('change', () => {
            const file = importInput.files && importInput.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(reader.result);
                } catch {
                    showToast({ title: 'Import failed', message: 'That file is not valid JSON.', type: 'error', duration: 0 });
                    importInput.value = '';
                    return;
                }

                const incoming = normalizeData(parsed);
                const summary = `${incoming.tasks.length} tasks, ${incoming.habits.length} habits, ${incoming.notes.length} notes, ${incoming.goals.length} goals, ${incoming.events.length} events and ${incoming.finances.expenses.length} expenses`;

                confirmAction({
                    title: 'Replace all data?',
                    message: 'Importing this file replaces everything stored in this browser with ' + summary + '. This cannot be undone.',
                    confirmLabel: 'Import and replace',
                    trigger: importBtn,
                    onConfirm: () => {
                        incoming.onboardingDone = true;
                        saveData(incoming);
                        window.location.reload();
                    }
                });

                importInput.value = '';
            };

            reader.onerror = () => {
                showToast({ title: 'Import failed', message: 'The file could not be read.', type: 'error', duration: 0 });
                importInput.value = '';
            };

            reader.readAsText(file);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            confirmAction({
                title: 'Clear all data?',
                message: 'Every task, habit, note, goal, event and expense stored in this browser will be deleted. This cannot be undone.',
                confirmLabel: 'Delete everything',
                trigger: clearBtn,
                onConfirm: () => {
                    const fresh = getDefaultData();
                    fresh.onboardingDone = true;
                    saveData(fresh);
                    window.location.reload();
                }
            });
        });
    }
}