// creatinggroup functions
function createGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    if (groupName === '') {
        alert('Please enter a group name.');
        return;
    }
    if (groupName.length > 20) {
        alert('Group name should not exceed 20 characters.');
        return;
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(groupName)) {  // only letters, numbers, spaces
        alert('Group name can only contain letters, numbers, and spaces.');
        return;
    }
    localStorage.setItem('groupName', groupName);
    localStorage.setItem('members', JSON.stringify([]));
    localStorage.setItem('expenses', JSON.stringify([]));
    window.location.href = 'members.html';
}


// Utility functions
function getStoredData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}
function loadGroupName() {
    const groupName = localStorage.getItem('groupName') || 'Unknown Group';
    document.getElementById('groupNameDisplay').innerText = groupName;
}
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Members Page Functions
function addMember() {
    const memberName = document.getElementById('memberName').value.trim();
    if (memberName === '') {
        alert('Please enter a member name.');
        return;
    }
    if (memberName.length > 20) {
        alert('Member name should not exceed 20 characters.');
        return;
    }

    if (!/^[a-zA-Z]+$/.test(memberName)) {
        alert('Member name can only contain letters, numbers, and spaces.');
        return;
    }

    const members = getStoredData('members');
    members.push(memberName);
    saveData('members', members);
    renderMembers();
    document.getElementById('memberName').value = '';
}

function renderMembers() {
    const members = getStoredData('members');
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';
    members.forEach((member, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${member} <button onclick="removeMember(${index})">Remove</button>`;
        membersList.appendChild(li);
    });
}

function removeMember(index) {
    const members = getStoredData('members');
    members.splice(index, 1);
    saveData('members', members);
    renderMembers();
}

function initMembersPage() {
    document.getElementById('groupNameDisplay').innerText = localStorage.getItem('groupName') || 'Unnamed Group';
    renderMembers();
}

function goToExpenses() {
    if (getStoredData('members').length === 0) {
        alert('Please add members before proceeding.');
        return;
    }
    window.location.href = 'expenses.html';
}

// Expenses Page Functions
function addExpense() {
    const payer = document.getElementById('payer').value;
    const amount = parseFloat(document.getElementById('amount').value);
    if (!payer || isNaN(amount) || amount <= 0) {
        alert('Enter valid payer and amount.');
        return;
    }
    const expenses = getStoredData('expenses');
    expenses.push({ payer, amount });
    saveData('expenses', expenses);
    renderExpenses();
}

function renderExpenses() {
    const expensesList = document.getElementById('expensesList');
    expensesList.innerHTML = '';
    getStoredData('expenses').forEach(exp => {
        const li = document.createElement('li');
        li.innerText = `${exp.payer} paid ₹${exp.amount}`;
        expensesList.appendChild(li);
    });
}

function initExpensesPage() {
    const members = getStoredData('members');
    const payerSelect = document.getElementById('payer');
    payerSelect.innerHTML = members.map(member => `<option value="${member}">${member}</option>`).join('');
    renderExpenses();
}

function viewSummary() {
    window.location.href = 'summary.html';
}

// Summary Page Functions
function calculateBalances() {
    const members = getStoredData('members');
    const expenses = getStoredData('expenses');

    const balances = Object.fromEntries(members.map(m => [m, 0]));
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const share = total / members.length;

    expenses.forEach(({ payer, amount }) => balances[payer] += amount);
    members.forEach(m => balances[m] -= share);

    return balances;
}

function initSummaryPage() {
    const balances = calculateBalances();
    const balancesList = document.getElementById('balancesList');
    balancesList.innerHTML = Object.entries(balances).map(([m, b]) =>
        `<li>${m} ${b >= 0 ? 'should receive' : 'owes'} ₹${Math.abs(b).toFixed(2)}</li>`
    ).join('');
}

function restartApp() {
    localStorage.clear();
    window.location.href = 'index.html';
}
