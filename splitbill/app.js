// Utility functions for localStorage handling
function getStoredData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function createGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    if (!groupName) {
        alert('Please enter a valid group name');
        return;
    }
    const groups = getStoredData('groups');
    if (groups.some(g => g.toLowerCase() === groupName.toLowerCase())) {
        alert('Group already exists. Please open it from the list or search it.');
        return;
    }
    groups.push(groupName);
    saveData('groups', groups);
    saveData(`${groupName}_members`, []);
    saveData(`${groupName}_expenses`, []);
    localStorage.setItem('currentGroup', groupName);
    window.location.href = 'members.html';
}

function loadGroups() {
    const groups = getStoredData('groups');
    renderGroups(groups);
}

function renderGroups(groups) {
    const groupList = document.getElementById('groupList');
    groupList.innerHTML = groups.map(g =>
        `<li>
            <span>${g}</span>
            <div>
                <button onclick="manageGroup('${g}')">Manage</button>
                <button onclick="removeGroup('${g}')">Remove</button>
            </div>
        </li>`
    ).join('');
}

function filterGroups() {
    const search = document.getElementById('groupSearch').value.toLowerCase();
    const groups = getStoredData('groups');
    const filtered = groups.filter(g => g.toLowerCase().includes(search));
    renderGroups(filtered);
}

function manageGroup(groupName) {
    localStorage.setItem('currentGroup', groupName);
    window.location.href = 'members.html';
}

function removeGroup(groupName) {
    if (confirm(`Are you sure you want to delete group "${groupName}"? This will delete all data for the group.`)) {
        const groups = getStoredData('groups').filter(g => g !== groupName);
        saveData('groups', groups);
        localStorage.removeItem(`${groupName}_members`);
        localStorage.removeItem(`${groupName}_expenses`);
        renderGroups(groups);
    }
}

function getCurrentGroup() {
    return localStorage.getItem('currentGroup');
}

// Member Management
function addMember() {
    const memberName = document.getElementById('memberName').value.trim();
    if (!memberName) return alert('Enter member name');
    const group = getCurrentGroup();
    const members = getStoredData(`${group}_members`);
    if (members.includes(memberName)) return alert('Member exists');
    members.push(memberName);
    saveData(`${group}_members`, members);
    renderMembers();
    document.getElementById('memberName').value = '';
}

function renderMembers() {
    const group = getCurrentGroup();
    const members = getStoredData(`${group}_members`);
    const membersList = document.getElementById('membersList');

    membersList.innerHTML = members.map((m, i) =>
        `<li>${m} <button onclick="removeMember(${i})">Remove</button></li>`
    ).join('');
}

function removeMember(index) {
    const group = getCurrentGroup();
    const members = getStoredData(`${group}_members`);
    members.splice(index, 1);
    saveData(`${group}_members`, members);
    renderMembers();
}

function initMembersPage() {
    document.getElementById('groupNameDisplay').innerText = getCurrentGroup();
    renderMembers();
}

function goToExpenses() {
    const group = getCurrentGroup();
    if (getStoredData(`${group}_members`).length === 0) {
        alert('Please add members first.');
        return;
    }
    window.location.href = 'expenses.html';
}

// Expense Management
function addExpense() {
    const group = getCurrentGroup();  // Get active group
    const payer = document.getElementById('payer').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const purpose = document.getElementById('expensePurpose').value.trim() || 'Miscellaneous';

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    const now = new Date();
    const dateTime = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); 

    const expenses = getStoredData(`${group}_expenses`);  // Group-based expenses
    expenses.push({ payer, amount, purpose, dateTime });
    saveData(`${group}_expenses`, expenses);  // Save back to localStorage

    document.getElementById('amount').value = '';
    document.getElementById('expensePurpose').value = '';
    renderExpenses();  // Refresh display
}


function displayExpenses() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';

    expenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${expense.payer} paid ₹${expense.amount} for <strong>${expense.purpose}</strong>
            <button onclick="removeExpense(${index})">Remove</button>`;
        expensesList.appendChild(li);
    });
}

function removeExpense(index) {
    const group = getCurrentGroup();
    const expenses = getStoredData(`${group}_expenses`);
    expenses.splice(index, 1);
    saveData(`${group}_expenses`, expenses);
    renderExpenses();
}


function renderExpenses() {
    const group = getCurrentGroup();
    const expenses = getStoredData(`${group}_expenses`);
    expenses.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = expenses.map((expense, index) => `
        <li>
            ${expense.payer} paid ₹${expense.amount.toFixed(2)} for <strong>${expense.purpose}</strong>
            <br>
            <small>🕒 Paid on: ${expense.dateTime}</small>
            <br>
            <button onclick="removeExpense(${index})">Remove</button>
        </li>
    `).join('');
}

function initExpensesPage() {
    const group = getCurrentGroup();
    const members = getStoredData(`${group}_members`);
    const payerSelect = document.getElementById('payer');

    payerSelect.innerHTML = members.map(m => `<option value="${m}">${m}</option>`).join('');
    renderExpenses();
}

function viewSummary() {
    window.location.href = 'summary.html';
}

// Balance Calculation
function calculateBalances() {
    const group = getCurrentGroup();
    const members = getStoredData(`${group}_members`);
    const expenses = getStoredData(`${group}_expenses`);

    const balances = {};
    members.forEach(m => balances[m] = 0);

    expenses.forEach(({ payer, amount }) => balances[payer] += amount);

    const perPersonShare = expenses.reduce((sum, e) => sum + e.amount, 0) / members.length;

    members.forEach(member => {
        balances[member] -= perPersonShare;
    });

    return balances;
}

function calculateWhoOwesWhom(balances) {
    const transactions = [];
    const creditors = [], debtors = [];

    for (const [member, balance] of Object.entries(balances)) {
        if (balance > 0) creditors.push({ member, amount: balance });
        else if (balance < 0) debtors.push({ member, amount: -balance });
    }

    while (debtors.length && creditors.length) {
        const debtor = debtors[0]; 
        const creditor = creditors[0];
        const settlement = Math.min(debtor.amount, creditor.amount);
        transactions.push({
            debtor: debtor.member,
            creditor: creditor.member,
            amount: settlement
        });
        debtor.amount -= settlement;
        creditor.amount -= settlement;

        if (debtor.amount === 0) debtors.shift();
        if (creditor.amount === 0) creditors.shift();
    }

    return transactions;
}

function initSummaryPage() {
    const balances = calculateBalances();
    const transactions = calculateWhoOwesWhom(balances);
    const balancesList = document.getElementById('balancesList');

    balancesList.innerHTML = transactions.map(({ debtor, creditor, amount }, index) => {
        const transactionKey = `${debtor}_${creditor}_${amount}_history`;
        const history = JSON.parse(localStorage.getItem(transactionKey)) || [];

        const totalPaid = history.reduce((sum, record) => sum + record.amount, 0);
        const isCleared = totalPaid >= amount;

        return `
            <li id="transaction-${index}" style="${isCleared ? 'background-color:#e6ffe6;' : ''}">
                ${isCleared 
                    ? `<div style="color:green;">
                        <strong><span style="color:orangered;">${debtor}'s</span> Payment Cleared</strong>
                        </div>
                        ${displayPaymentHistory(history)}
                       <br><small>✅ Total Paid: ₹${totalPaid.toFixed(2)} (Cleared)</small>`
                    : `${debtor} should pay ₹${amount.toFixed(2)} to ${creditor}
                       <br>${displayPaymentHistory(history)}`
                }
                <br>
                <button 
                    id="payButton-${index}" 
                    onclick="markPayment('${debtor}', '${creditor}', ${amount}, 'pay', ${index})"
                    ${isCleared ? 'style="display:none;"' : ''}>Pay</button>
            </li>
        `;
    }).join('');
}

function displayPaymentHistory(history) {
    if (history.length === 0) {
        return `<small>No payments made yet.</small>`;
    }

    return `
        <b>💰 Payment History:</b><br>
        <ul style="margin:0; padding:0; list-style:none;">
            ${history.map(entry => `
                <li>✅ ₹${entry.amount.toFixed(2)} on ${entry.dateTime}</li>
            `).join('')}
        </ul>
    `;
}


function markPayment(debtor, creditor, amount, action, index) {
    const transactionKey = `${debtor}_${creditor}_${amount}_history`;

    let history = JSON.parse(localStorage.getItem(transactionKey)) || [];

    if (action === 'pay') {
        const now = new Date();
        const dateTime = now.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        // Add new payment record to history
        history.push({
            amount,
            dateTime
        });

        // Save back to localStorage
        localStorage.setItem(transactionKey, JSON.stringify(history));

        // Update UI
        initSummaryPage();
    } else if (action === 'paid') {
        alert(`${creditor} confirms receiving ₹${amount.toFixed(2)} from ${debtor}.`);
    }
}


function restartApp() {
    const confirmReset = confirm('Are you sure you want to reset all data & start over? This will clear all expenses, members, and balances.');
    
    if (confirmReset) {
        const groups = getStoredData('groups');  // Fetch existing group names before clearing
        saveData('groups', groups);  
               
        window.location.href = 'index.html';
    }
}
// Navigation
function goBack() {
    const page = window.location.pathname.split('/').pop();

    if (page === 'members.html') {
        window.location.href = 'index.html';
    } else if (page === 'expenses.html') {
        window.location.href = 'members.html';
    } else if (page === 'summary.html') {
        window.location.href = 'expenses.html';
    }
}

function goNext() {
    const page = window.location.pathname.split('/').pop();

    if (page === 'index.html') {
        if (getCurrentGroup()) {
            window.location.href = 'members.html';
        } else {
            alert('Please select or create a group first.');
        }
    } else if (page === 'members.html') {
        window.location.href = 'expenses.html';
    } else if (page === 'expenses.html') {
        window.location.href = 'summary.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('groupList')) loadGroups();
});
