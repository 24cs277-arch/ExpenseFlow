
const expenseModal = document.getElementById("expenseModal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtn = document.getElementById("closeModal");
const expenseForm = document.getElementById("expenseForm");
const transactionList = document.getElementById("transactionList");
const searchInput = document.getElementById("searchInput");

let expenses = [];

try {
    expenses = JSON.parse(localStorage.getItem("expenses")) || [];
    if (!Array.isArray(expenses)) expenses = [];
} catch {
    expenses = [];
}

let expenseChart = null;
let editingExpenseId = null;

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

function isCurrentMonth(expense) {
    const today = new Date();
    const expenseDate = new Date(expense.date + "T00:00:00");

    return expenseDate.getMonth() === today.getMonth() &&
           expenseDate.getFullYear() === today.getFullYear();
}

openModalBtn.addEventListener("click", function () {
    editingExpenseId = null;
    expenseForm.reset();

    document.getElementById("date").value = getTodayDate();
    document.querySelector(".modal-content h2").textContent = "Add New Expense";

    expenseModal.classList.add("show");
});

closeModalBtn.addEventListener("click", function () {
    expenseModal.classList.remove("show");
    editingExpenseId = null;
});

expenseModal.addEventListener("click", function (event) {
    if (event.target === expenseModal) {
        expenseModal.classList.remove("show");
        editingExpenseId = null;
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        expenseModal.classList.remove("show");
        editingExpenseId = null;
    }
});

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const description = document.getElementById("description").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (!description || !Number.isFinite(amount) || amount <= 0 ||
        !category || !date) {
        alert("Please enter valid expense details.");
        return;
    }

    if (date > getTodayDate()) {
        alert("Expense date cannot be in the future.");
        return;
    }

    if (editingExpenseId !== null) {
        const expense = expenses.find(item => item.id === editingExpenseId);

        if (expense) {
            expense.description = description;
            expense.amount = amount;
            expense.category = category;
            expense.date = date;
        }

        editingExpenseId = null;
    } else {
        expenses.push({
            id: Date.now() + Math.random(),
            description,
            amount,
            category,
            date
        });
    }

    saveExpenses();
    updateDashboard();

    expenseForm.reset();
    expenseModal.classList.remove("show");
    document.querySelector(".modal-content h2").textContent = "Add New Expense";
});

function editExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) return;

    editingExpenseId = id;

    document.getElementById("description").value = expense.description;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("category").value = expense.category;
    document.getElementById("date").value = expense.date;

    document.querySelector(".modal-content h2").textContent = "Edit Expense";
    expenseModal.classList.add("show");
}

function deleteExpense(id) {
    const confirmDelete = confirm("Are you sure you want to delete this expense?");

    if (confirmDelete) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        updateDashboard();
    }
}

function displayTransactions() {
    transactionList.innerHTML = "";

    const searchTerm = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filteredExpenses = [...expenses]
        .filter(expense =>
            expense.description.toLowerCase().includes(searchTerm) ||
            expense.category.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) =>
            b.date.localeCompare(a.date) || b.id - a.id
        );

    if (filteredExpenses.length === 0) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No matching transactions found.
                </td>
            </tr>
        `;
        return;
    }

    filteredExpenses.forEach(expense => {
        const row = document.createElement("tr");

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = expense.description;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = expense.category;

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(
            expense.date + "T00:00:00"
        ).toLocaleDateString("en-IN");

        const amountCell = document.createElement("td");
        amountCell.textContent = formatCurrency(expense.amount);

        const actionCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";

        editButton.addEventListener("click", function () {
            editExpense(expense.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function () {
            deleteExpense(expense.id);
        });

        const actionButtons = document.createElement("div");
        actionButtons.className = "action-buttons";
        actionButtons.append(editButton, deleteButton);

        actionCell.appendChild(actionButtons);

        row.append(
            descriptionCell,
            categoryCell,
            dateCell,
            amountCell,
            actionCell
        );

        transactionList.appendChild(row);
    });
}

function updateSummary() {
    const currentMonthExpenses = expenses.filter(isCurrentMonth);

    const total = currentMonthExpenses.reduce(
        (sum, expense) => sum + expense.amount, 0
    );

    const todayTotal = expenses
        .filter(expense => expense.date === getTodayDate())
        .reduce((sum, expense) => sum + expense.amount, 0);

    document.getElementById("totalExpenses").textContent =
        formatCurrency(total);

    document.getElementById("todayExpenses").textContent =
        formatCurrency(todayTotal);

    document.getElementById("totalTransactions").textContent =
        expenses.length;
}

function updateCategoryOverview() {
    const categories = {
        Food: 0,
        Travel: 0,
        Shopping: 0,
        Others: 0
    };

    expenses.filter(isCurrentMonth).forEach(expense => {
        if (expense.category === "Bills") {
            categories.Others += expense.amount;
        } else if (categories.hasOwnProperty(expense.category)) {
            categories[expense.category] += expense.amount;
        }
    });

    document.getElementById("foodTotal").textContent =
        formatCurrency(categories.Food);

    document.getElementById("travelTotal").textContent =
        formatCurrency(categories.Travel);

    document.getElementById("shoppingTotal").textContent =
        formatCurrency(categories.Shopping);

    document.getElementById("othersTotal").textContent =
        formatCurrency(categories.Others);
}

function updateChart() {
    const categoryTotals = {};

    expenses.filter(isCurrentMonth).forEach(expense => {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    const ctx = document.getElementById("expenseChart");

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#38d9a9",
                    "#4d96ff",
                    "#ffb86c",
                    "#ff6b81",
                    "#b197fc"
                ],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#aebbc8",
                        padding: 20
                    }
                }
            }
        }
    });
}

function updateDashboard() {
    updateSummary();
    displayTransactions();
    updateCategoryOverview();
    updateChart();
}

if (searchInput) {
    searchInput.addEventListener("input", displayTransactions);
}

document.getElementById("date").value = getTodayDate();

updateDashboard();
