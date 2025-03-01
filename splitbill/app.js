// Utility functions
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

    const groupExists = groups.some(g => g.toLowerCase() === groupName.toLowerCase());

    if (groupExists) {
        alert('Group already exists. Please open it from the list or search it.');
        return;
    }
    groups.push(groupName);
    saveData('groups', groups);

    // Initialize group-specific data
    saveData(`${groupName}_members`, []);
    saveData(`${groupName}_expenses`, []);

    localStorage.setItem('currentGroup', groupName);
    window.open('members.html', '_blank');
}

function loadGroups() {
    const groups = getStoredData('groups');
    renderGroups(groups);
}

function renderGroups(groups) {
    const groupList = document.getElementById('groupList');
    groupList.innerHTML = groups.map(g =>
        `<li><button onclick="selectGroup('${g}')">${g}</button></li>`
    ).join('');
}

function filterGroups() {
    const search = document.getElementById('groupSearch').value.toLowerCase();
    const groups = getStoredData('groups');
    const filtered = groups.filter(g => g.toLowerCase().includes(search));
    renderGroups(filtered);
}

function selectGroup(groupName) {
    localStorage.setItem('currentGroup', groupName);
    window.open('members.html', '_blank');
}

function getCurrentGroup() {
    return localStorage.getItem('currentGroup');
}

// Member Management
function addMember() {
    const memberName = document.getElementById('memberName').value.trim();
    const group = getCurrentGroup();
    const members = getStoredData(`${group}_members`);

    if (!memberName || members.includes(memberName)) {
        alert('Invalid or duplicate member');
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
        alert('Please add members first');
        return;
    }
    window.open('expenses.html', '_blank');
}

// Expense Management
function addExpense() {
    const group = getCurrentGroup();
    const payer = document.getElementById('payer').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!payer || isNaN(amount) || amount <= 0) {
        alert('Enter valid payer and amount');
        return;
    }

    const expenses = getStoredData(`${group}_expenses`);
    expenses.push({ payer, amount });
    saveData(`${group}_expenses`, expenses);

    renderExpenses();
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
    window.open('summary.html', '_blank');
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

    const creditors = [];
    const debtors = [];

    for (const [member, balance] of Object.entries(balances)) {
        if (balance > 0) {
            creditors.push({ member, amount: balance });
        } else if (balance < 0) {
            debtors.push({ member, amount: -balance });
        }
    }

    while (debtors.length && creditors.length) {
        const debtor = debtors[0];
        const creditor = creditors[0];

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
    const groups = getStoredData('groups');  // Save groups before clearing
    localStorage.clear();  // Clear all data
    saveData('groups', groups);  // Restore only the group names
    window.open('index.html', '_blank');
}
function initGroupsPage() {
    loadGroups();
}

document.addEventListener('DOMContentLoaded', initGroupsPage);

function goBack() {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'members.html') {
        window.location.href = 'index.html';  // Back to groups page
    } else if (currentPage === 'expenses.html') {
        window.location.href = 'members.html';  // Back to members page
    } else if (currentPage === 'summary.html') {
        window.location.href = 'expenses.html';  // Back to expenses page
    }
}

function goNext() {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html') {
        const currentGroup = localStorage.getItem('currentGroup');
        if (currentGroup) {
            window.location.href = 'members.html';  // Go to members page if group is selected
        } else {
            alert('Please select or create a group first.');
        }
    } else if (currentPage === 'members.html') {
        window.location.href = 'expenses.html';  // Go to expenses page
    } else if (currentPage === 'expenses.html') {
        window.location.href = 'summary.html';  // Go to summary page
    }
}
