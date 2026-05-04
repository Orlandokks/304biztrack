
// function openSidebar() {
//     var side = document.getElementById('sidebar');
//     side.style.display = (side.style.display === "block") ? "none" : "block";
// }

// function closeSidebar() {
//     document.getElementById('sidebar').style.display = 'none';
// }


function openForm() {
    var form = document.getElementById("transaction-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("transaction-form").style.display = "none";
}


let transactions = [];
let serialNumberCounter;

window.onload = function () {
    const storedTransactions = localStorage.getItem("bizTrackTransactions");
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    } else {
        transactions = [
            {
                trID: 1,
                trDate: "2024-01-05",
                trCategory: "Rent",
                trAmount: 100.00,
                trNotes: "January Rent"
            },
            {
                trID: 2,
                trDate: "2024-01-15",
                trCategory: "Order Fulfillment",
                trAmount: 35.00,
                trNotes: "Order #1005"
            },
            {
                trID: 3,
                trDate: "2024-01-08",
                trCategory: "Utilities",
                trAmount: 120.00,
                trNotes: "Internet"
            },
            {
                trID: 4,
                trDate: "2024-02-05",
                trCategory: "Supplies",
                trAmount: 180.00,
                trNotes: "Embroidery Machine"
            },
            {
                trID: 5,
                trDate: "2024-01-25",
                trCategory: "Miscellaneous",
                trAmount: 20.00,
                trNotes: "Pizza"
            },
        ];

        serialNumberCounter = transactions.length + 1
  
        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));
    }
  
    renderTransactions(transactions);
}

function addOrUpdate(event) {
    let type = document.getElementById("submitBtn").textContent;
    if (type === 'Add') {
        newTransaction(event);
    } else if (type === 'Update'){
        const trId = document.getElementById("tr-id").value;
        updateTransaction(+trId); // convert to number
    }
}


function newTransaction(event) {
    event.preventDefault();
    const trDate = document.getElementById("tr-date").value;
    const trCategory = document.getElementById("tr-category").value;
    const trAmount = parseFloat(document.getElementById("tr-amount").value);
    const trNotes = document.getElementById("tr-notes").value;

    serialNumberCounter = transactions.length + 1;
    let trID = serialNumberCounter;
    
    const transaction = {
      trID,
      trDate,
      trCategory,
      trAmount,
      trNotes,
    };
    
    transactions.push(transaction);
  
    renderTransactions(transactions);
    localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

    serialNumberCounter++;
    displayExpenses();
  
    document.getElementById("transaction-form").reset();
}


function renderTransactions(transactions) {
  const transactionTableBody = document.getElementById("tableBody");

  /*
   * SECURITY FIX:
   * The original transaction table was generated with `innerHTML`, and
   * transaction notes are free-text user input. Rendering notes through
   * innerHTML allows user-provided markup to be parsed as HTML.
   *
   * This implementation uses DOM API construction and textContent-based cells
   * so that notes such as `<img src=x onerror=alert(1)>` are displayed as text
   * rather than executed.
   */
  BizTrackSafeDOM.clearElement(transactionTableBody);

  transactions.forEach((transaction) => {
    const transactionRow = document.createElement("tr");
    transactionRow.className = "transaction-row";

    transactionRow.dataset.trID = transaction.trID;
    transactionRow.dataset.trDate = transaction.trDate;
    transactionRow.dataset.trCategory = transaction.trCategory;
    transactionRow.dataset.trAmount = transaction.trAmount;
    transactionRow.dataset.trNotes = transaction.trNotes;

    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trID);
    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trDate);
    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trCategory);
    BizTrackSafeDOM.appendTextCell(
      transactionRow,
      BizTrackSafeDOM.formatCurrency(transaction.trAmount),
      "tr-amount"
    );
    BizTrackSafeDOM.appendTextCell(transactionRow, transaction.trNotes);

    /*
     * SECURITY FIX:
     * The previous action icons used dynamically generated inline onclick
     * handlers. Event listeners avoid embedding transaction IDs inside HTML
     * or JavaScript strings.
     */
    const editButton = BizTrackSafeDOM.createIconButton({
      label: `Edit expense ${BizTrackSafeDOM.toDisplayText(transaction.trID)}`,
      title: "Edit",
      iconClassName: "fa-solid fa-pen-to-square",
      className: "icon-button edit-icon",
      onClick: () => editRow(transaction.trID),
    });

    const deleteButton = BizTrackSafeDOM.createIconButton({
      label: `Delete expense ${BizTrackSafeDOM.toDisplayText(transaction.trID)}`,
      title: "Delete",
      iconClassName: "fas fa-trash-alt",
      className: "icon-button delete-icon",
      onClick: () => deleteTransaction(transaction.trID),
    });

    BizTrackSafeDOM.appendActionCell(transactionRow, [
      editButton,
      deleteButton,
    ]);

    transactionTableBody.appendChild(transactionRow);
  });

  displayExpenses();
}


function displayExpenses() {
  const resultElement = document.getElementById("total-expenses");

  /*
   * SECURITY FIX:
   * Summary output is rendered using textContent-based DOM construction for
   * consistency with the safer rendering model adopted across the CRUD pages.
   */
  const totalExpenses = transactions.reduce(
    (total, transaction) => total + Number(transaction.trAmount || 0),
    0
  );

  BizTrackSafeDOM.setSingleTextSpan(
    resultElement,
    `Total Expenses: $${totalExpenses.toFixed(2)}`
  );
}

function editRow(trID) {
    const trToEdit = transactions.find(transaction => transaction.trID == trID);
    
    document.getElementById("tr-id").value = trToEdit.trID;      
    document.getElementById("tr-date").value = trToEdit.trDate;
    document.getElementById("tr-category").value = trToEdit.trCategory;
    document.getElementById("tr-amount").value = trToEdit.trAmount;
    document.getElementById("tr-notes").value = trToEdit.trNotes;
  
    document.getElementById("submitBtn").textContent = "Update";

    document.getElementById("transaction-form").style.display = "block";
  }
  
function deleteTransaction(trID) {
    const indexToDelete = transactions.findIndex(transaction => transaction.trID == trID);

    if (indexToDelete !== -1) {
        transactions.splice(indexToDelete, 1);

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);
    }
}

  function updateTransaction(trID) {
    const indexToUpdate = transactions.findIndex(transaction => transaction.trID === trID);

    if (indexToUpdate !== -1) {
        const updatedTransaction = {
            trID: trID,
            trDate: document.getElementById("tr-date").value,
            trCategory: document.getElementById("tr-category").value,
            trAmount: parseFloat(document.getElementById("tr-amount").value),
            trNotes: document.getElementById("tr-notes").value,
        };

        transactions[indexToUpdate] = updatedTransaction;

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);

        document.getElementById("transaction-form").reset();
        document.getElementById("submitBtn").textContent = "Add";
    }
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "trID" || column === "trAmount";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
            // Case-insensitive string comparison for text columns
            return aValue.localeCompare(bValue, undefined, { sensitivity: "base" });
        } else {
            return aValue - bValue;
        }
    });

    rows.forEach(row => tbody.removeChild(row));

    sortedRows.forEach(row => tbody.appendChild(row));
}

document.getElementById("searchInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        performSearch();
    }
});


function performSearch() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll(".transaction-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


function exportToCSV() {
    const transactionsToExport = transactions.map(transaction => {
        return {
            trID: transaction.trID,
            trDate: transaction.trDate,
            trCategory: transaction.trCategory,
            trAmount: transaction.trAmount.toFixed(2),
            trNotes: transaction.trNotes,
        };
    });
  
    const csvContent = generateCSV(transactionsToExport);
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
  
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'biztrack_expense_table.csv';
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
  
function generateCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(order => Object.values(order).join(','));

    return `${headers}\n${rows.join('\n')}`;
}
