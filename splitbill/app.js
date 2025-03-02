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
    const group = getCurrentGroup();

    if (!memberName) {
        alert('Please enter a member name.');
        return;
    }

    const members = getStoredData(`${group}_members`);

    if (members.includes(memberName)) {
        alert('Member already exists.');
        return;
    }

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
    const payer = document.getElementById('payer').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!payer) {
        alert('Please select a payer.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount.');
        return;
    }

    const group = getCurrentGroup();
    const expenses = getStoredData(`${group}_expenses`);

    expenses.push({ payer, amount });
    saveData(`${group}_expenses`, expenses);

    renderExpenses();
    document.getElementById('amount').value = '';
}

function renderExpenses() {
    const group = getCurrentGroup();
    const expenses = getStoredData(`${group}_expenses`);
    const expensesList = document.getElementById('expensesList');

    expensesList.innerHTML = expenses.map(exp =>
        `<li>${exp.payer} paid ₹${exp.amount.toFixed(2)}</li>`
    ).join('');
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
        const debtor = debtors[0], creditor = creditors[0];
        const settlement = Math.min(debtor.amount, creditor.amount);
        transactions.push(`${debtor.member} owes ₹${settlement.toFixed(2)} to ${creditor.member}`);

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

    balancesList.innerHTML = transactions.map(t => `<li>${t}</li>`).join('');
}
function restartApp() {
    const confirmReset = confirm('Are you sure you want to reset all data and start over? This will clear all expenses, members, and balances.');
    
    if (confirmReset) {
        const groups = getStoredData('groups');  // Fetch existing group names before clearing
        
        // Optional: Preserve group names if you want to retain just the group list
        saveData('groups', groups);  
        
        // Redirect to the main page (index.html) in the **same tab**
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
