import { calcBudget, clearFieldErrors, escapeHtml, formatDate, formatMoney, generateId, getMonthName, saveData, setFieldError, showToast, today } from '../utilities.js';
import { closeModal, openModal } from '../animations.js';
import { updateDashboardStats } from './dashboard.js';

const CLOSE_ICON = '<svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

export function initFinances(appState) {
    const expenseList = document.getElementById('expense-list');
    const expensesEmpty = document.getElementById('expenses-empty');
    const addBtn = document.getElementById('expense-add-btn');
    const monthLabel = document.getElementById('finance-month');
    const budgetEl = document.getElementById('finance-budget');
    const spentEl = document.getElementById('finance-spent');
    const remainingEl = document.getElementById('finance-remaining');
    const progressEl = document.getElementById('finance-progress');
    const progressTrack = document.getElementById('finance-progress-track');
    const budgetForm = document.getElementById('budget-form');
    const budgetInput = document.getElementById('budget-input');
    const expenseForm = document.getElementById('expense-form');
    const labelInput = document.getElementById('expense-label-input');
    const amountInput = document.getElementById('expense-amount-input');

    function commit() {
        saveData(appState.data);
        renderFinances();
        updateDashboardStats(appState);
    }

    function renderFinances() {
        const finances = appState.data.finances;
        const { budget, spent, remaining, pct } = calcBudget(finances);
        const now = new Date();

        if (monthLabel) monthLabel.textContent = getMonthName(now.getMonth()) + ' ' + now.getFullYear();
        if (budgetEl) budgetEl.textContent = formatMoney(budget);
        if (spentEl) spentEl.textContent = formatMoney(spent);
        if (remainingEl) remainingEl.textContent = formatMoney(Math.max(0, remaining));
        if (progressEl) progressEl.style.width = pct + '%';
        if (progressTrack) {
            progressTrack.setAttribute('aria-valuenow', String(Math.round(pct)));
            progressTrack.setAttribute('aria-valuetext', formatMoney(spent) + ' of ' + formatMoney(budget) + ' spent');
        }
        if (budgetInput && document.activeElement !== budgetInput) budgetInput.value = String(budget);

        if (!expenseList) return;

        const expenses = finances.expenses.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
        expenseList.innerHTML = '';

        if (expenses.length === 0) {
            if (expensesEmpty) {
                expensesEmpty.style.display = '';
                expenseList.appendChild(expensesEmpty);
            }
            return;
        }

        if (expensesEmpty) expensesEmpty.style.display = 'none';
        const fragment = document.createDocumentFragment();
        expenses.forEach((expense) => fragment.appendChild(createExpenseElement(expense)));
        expenseList.appendChild(fragment);
    }

    function createExpenseElement(expense) {
        const el = document.createElement('div');
        el.className = 'finance-item';
        el.dataset.id = expense.id;
        el.innerHTML = `
            <div class="finance-item__info">
                <div class="finance-item__label">${escapeHtml(expense.label)}</div>
                <div class="finance-item__date">${formatDate(expense.date)}</div>
            </div>
            <div class="finance-item__amount finance-item__amount--negative">-$${expense.amount.toFixed(2)}</div>
            <button type="button" class="btn btn--icon btn--ghost btn--sm expense-delete" aria-label="Delete expense ${escapeHtml(expense.label)}">${CLOSE_ICON}</button>`;

        el.querySelector('.expense-delete').addEventListener('click', () => {
            appState.data.finances.expenses = appState.data.finances.expenses.filter((entry) => entry.id !== expense.id);
            commit();
            showToast({ title: 'Expense deleted', type: 'info' });
        });

        return el;
    }

    if (budgetForm && budgetInput) {
        budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearFieldErrors(budgetForm);

            const value = parseInt(budgetInput.value, 10);
            if (!Number.isFinite(value) || value < 0) {
                setFieldError(budgetInput, 'Enter a monthly budget of 0 or more.');
                budgetInput.focus();
                return;
            }

            appState.data.finances.budget = value;
            commit();
            showToast({ title: 'Budget updated to ' + formatMoney(value), type: 'success' });
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            clearFieldErrors(expenseForm);
            openModal('modal-expense', addBtn);
        });
    }

    if (expenseForm) {
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!labelInput || !amountInput) return;
            clearFieldErrors(expenseForm);

            const label = labelInput.value.trim();
            if (!label) {
                setFieldError(labelInput, 'Describe what this expense was for.');
                labelInput.focus();
                return;
            }

            const amount = parseFloat(amountInput.value);
            if (!Number.isFinite(amount) || amount <= 0) {
                setFieldError(amountInput, 'Enter an amount greater than 0.');
                amountInput.focus();
                return;
            }

            appState.data.finances.expenses.push({
                id: generateId(),
                label,
                amount: Math.round(amount * 100) / 100,
                date: today()
            });

            commit();
            closeModal(document.getElementById('modal-expense'));
            expenseForm.reset();
            showToast({ title: 'Expense added!', type: 'success' });
        });
    }

    renderFinances();
}