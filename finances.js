
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

/**
 * Storage key used for persisting expense transactions in the browser.
 *
 * Academic rationale:
 * A named constant avoids repeating string literals across the file. This
 * improves maintainability and reduces the risk of typographical errors when
 * reading from or writing to localStorage.
 */
const TRANSACTIONS_STORAGE_KEY = "bizTrackTransactions";

/**
 * Default transaction records used when no persisted data exists.
 *
 * Academic rationale:
 * The original implementation embedded the default data directly inside
 * window.onload. Extracting it into a constant separates seed data from the
 * data-loading algorithm, improving cohesion and making the initialization
 * behavior easier to reason about and test.
 */
const DEFAULT_TRANSACTIONS = [
  {
    trID: 1,
    trDate: "2024-01-05",
    trCategory: "Rent",
    trAmount: 100.0,
    trNotes: "January Rent",
  },
  {
    trID: 2,
    trDate: "2024-01-15",
    trCategory: "Order Fulfillment",
    trAmount: 35.0,
    trNotes: "Order #1005",
  },
  {
    trID: 3,
    trDate: "2024-01-08",
    trCategory: "Utilities",
    trAmount: 120.0,
    trNotes: "Internet",
  },
  {
    trID: 4,
    trDate: "2024-02-05",
    trCategory: "Supplies",
    trAmount: 180.0,
    trNotes: "Embroidery Machine",
  },
  {
    trID: 5,
    trDate: "2024-01-25",
    trCategory: "Miscellaneous",
    trAmount: 20.0,
    trNotes: "Pizza",
  },
];

/**
 * Converts a transaction ID into a valid positive integer when possible.
 *
 * Data integrity rationale:
 * Data loaded from localStorage should not be blindly trusted. localStorage
 * can be edited manually by users or become inconsistent after previous bugs.
 * Normalizing IDs before comparison prevents type-related mismatches such as
 * "5" and 5 being treated inconsistently.
 *
 * @param {*} value - The transaction ID value to normalize.
 * @returns {number | null} A positive integer ID, or null if invalid.
 */
function normalizeTransactionId(value) {
  const numericId = Number(value);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  return numericId;
}

/**
 * Finds the next available positive integer transaction ID.
 *
 * Data integrity rationale:
 * The old algorithm used `transactions.length + 1`, which fails after deletion
 * because the number of records is not the same as the largest existing ID.
 * This function instead derives the next ID from the current maximum valid ID,
 * guaranteeing that the new ID is greater than every existing valid ID.
 *
 * @param {Array<Object>} transactionList - Current transaction records.
 * @returns {number} The next available unique transaction ID.
 */
function getNextTransactionId(transactionList) {
  if (!Array.isArray(transactionList) || transactionList.length === 0) {
    return 1;
  }

  const maxId = transactionList.reduce((currentMax, transaction) => {
    const normalizedId = normalizeTransactionId(transaction.trID);

    if (normalizedId === null) {
      return currentMax;
    }

    return Math.max(currentMax, normalizedId);
  }, 0);

  return maxId + 1;
}

/**
 * Finds the next unused transaction ID given a set of already-used IDs.
 *
 * Data migration rationale:
 * This helper is used when repairing persisted localStorage data. If a record
 * has a duplicate or invalid ID, it receives the next unused positive integer.
 * The algorithm is deterministic and preserves as many original IDs as
 * possible.
 *
 * @param {Set<number>} usedIds - IDs that are already assigned.
 * @returns {number} The next unused positive integer ID.
 */
function getNextUnusedTransactionId(usedIds) {
  let candidateId = 1;

  while (usedIds.has(candidateId)) {
    candidateId += 1;
  }

  return candidateId;
}

/**
 * Produces a transaction list in which every transaction has a unique,
 * positive integer ID.
 *
 * Data integrity rationale:
 * Because the previous implementation could already have stored duplicate IDs
 * in localStorage, future-safe ID generation is not enough. The application
 * must also repair existing persisted records on load. This function performs
 * a lightweight client-side migration:
 *
 * 1. Valid, unused IDs are preserved.
 * 2. Duplicate IDs are reassigned.
 * 3. Invalid IDs are reassigned.
 * 4. Other transaction fields are preserved.
 *
 * This protects edit/delete operations from ambiguous ID matching.
 *
 * @param {Array<Object>} transactionList - Raw transactions from storage.
 * @returns {Array<Object>} Transactions with repaired unique IDs.
 */
function ensureUniqueTransactionIds(transactionList) {
  const usedIds = new Set();

  return transactionList.map((transaction) => {
    const originalId = normalizeTransactionId(transaction.trID);

    if (originalId !== null && !usedIds.has(originalId)) {
      usedIds.add(originalId);

      return {
        ...transaction,
        trID: originalId,
      };
    }

    const repairedId = getNextUnusedTransactionId(usedIds);
    usedIds.add(repairedId);

    return {
      ...transaction,
      trID: repairedId,
    };
  });
}

/**
 * Safely loads transactions from localStorage.
 *
 * Defensive programming rationale:
 * JSON.parse can throw if stored data is corrupted. The original code assumed
 * that localStorage always contained valid JSON. This loader handles invalid
 * or unexpected data by falling back to default transactions, then normalizes
 * IDs to preserve application consistency.
 *
 * @returns {Array<Object>} A safe transaction list.
 */
function loadTransactions() {
  const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);

  if (!storedTransactions) {
    return ensureUniqueTransactionIds([...DEFAULT_TRANSACTIONS]);
  }

  try {
    const parsedTransactions = JSON.parse(storedTransactions);

    if (!Array.isArray(parsedTransactions)) {
      return ensureUniqueTransactionIds([...DEFAULT_TRANSACTIONS]);
    }

    return ensureUniqueTransactionIds(parsedTransactions);
  } catch (error) {
    console.warn(
      "Invalid transaction data was found in localStorage. Falling back to default transactions.",
      error
    );

    return ensureUniqueTransactionIds([...DEFAULT_TRANSACTIONS]);
  }
}

/**
 * Persists the current transaction list to localStorage.
 *
 * Maintainability rationale:
 * Centralizing persistence avoids repeated localStorage.setItem calls and
 * makes future changes to storage behavior easier.
 *
 * @param {Array<Object>} transactionList - Transactions to persist.
 */
function saveTransactions(transactionList) {
  localStorage.setItem(
    TRANSACTIONS_STORAGE_KEY,
    JSON.stringify(transactionList)
  );
}


window.onload = function () {
  /*
   * DATA INTEGRITY FIX:
   * Transactions are loaded through a defensive loader that repairs duplicate
   * or invalid transaction IDs. The repaired list is immediately persisted so
   * that the application state remains consistent after refresh.
   */
  transactions = loadTransactions();
  saveTransactions(transactions);

  renderTransactions(transactions);
};

function addOrUpdate(event) {
  const type = document.getElementById("submitBtn").textContent;

  if (type === "Add") {
    newTransaction(event);
    return;
  }

  if (type === "Update") {
    /*
     * DATA INTEGRITY FIX:
     * The raw hidden input value is passed to updateTransaction(), where it is
     * normalized and validated. Keeping normalization in one place prevents
     * inconsistent conversion rules across different functions.
     */
    const trId = document.getElementById("tr-id").value;
    updateTransaction(trId);
  }
}

function newTransaction(event) {
  event.preventDefault();

  const trDate = document.getElementById("tr-date").value;
  const trCategory = document.getElementById("tr-category").value;
  const trAmount = parseFloat(document.getElementById("tr-amount").value);
  const trNotes = document.getElementById("tr-notes").value;

  /*
   * DATA INTEGRITY FIX:
   * The original implementation used `transactions.length + 1`, which can
   * create duplicate IDs after a middle record is deleted. The revised
   * implementation derives the next ID from the maximum existing valid ID.
   */
  const trID = getNextTransactionId(transactions);

  const transaction = {
    trID,
    trDate,
    trCategory,
    trAmount,
    trNotes,
  };

  transactions.push(transaction);

  /*
   * Defensive step:
   * Although getNextTransactionId() should produce a unique ID, the list is
   * normalized again before persistence. This protects the application if
   * localStorage was modified externally while the page was open.
   */
  transactions = ensureUniqueTransactionIds(transactions);
  saveTransactions(transactions);

  renderTransactions(transactions);

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
  /*
   * DATA INTEGRITY FIX:
   * Transaction IDs are normalized before comparison. This avoids loose
   * equality and prevents type inconsistencies between string IDs from DOM
   * events and numeric IDs stored in the transaction list.
   */
  const normalizedId = normalizeTransactionId(trID);

  if (normalizedId === null) {
    console.warn("Cannot edit transaction because the transaction ID is invalid:", trID);
    return;
  }

  const trToEdit = transactions.find(
    (transaction) => normalizeTransactionId(transaction.trID) === normalizedId
  );

  if (!trToEdit) {
    console.warn("Cannot edit transaction because no matching record was found:", trID);
    return;
  }

  document.getElementById("tr-id").value = trToEdit.trID;
  document.getElementById("tr-date").value = trToEdit.trDate;
  document.getElementById("tr-category").value = trToEdit.trCategory;
  document.getElementById("tr-amount").value = trToEdit.trAmount;
  document.getElementById("tr-notes").value = trToEdit.trNotes;

  document.getElementById("submitBtn").textContent = "Update";
  document.getElementById("transaction-form").style.display = "block";
}

function deleteTransaction(trID) {
  /*
   * DATA INTEGRITY FIX:
   * Deletion now uses normalized numeric ID comparison instead of loose
   * equality. This makes the operation deterministic and prevents ambiguous
   * matching when IDs are stored as strings or numbers.
   */
  const normalizedId = normalizeTransactionId(trID);

  if (normalizedId === null) {
    console.warn("Cannot delete transaction because the transaction ID is invalid:", trID);
    return;
  }

  const indexToDelete = transactions.findIndex(
    (transaction) => normalizeTransactionId(transaction.trID) === normalizedId
  );

  if (indexToDelete !== -1) {
    transactions.splice(indexToDelete, 1);

    /*
     * Deleting a record no longer affects future ID uniqueness because new IDs
     * are based on the maximum existing ID, not the array length.
     */
    saveTransactions(transactions);
    renderTransactions(transactions);
  }
}

function updateTransaction(trID) {
  /*
   * DATA INTEGRITY FIX:
   * The hidden form field stores the transaction ID being edited. The ID is
   * normalized before lookup so that update behavior remains consistent
   * regardless of whether the value came from the DOM as a string or from
   * application state as a number.
   */
  const normalizedId = normalizeTransactionId(trID);

  if (normalizedId === null) {
    console.warn("Cannot update transaction because the transaction ID is invalid:", trID);
    return;
  }

  const indexToUpdate = transactions.findIndex(
    (transaction) => normalizeTransactionId(transaction.trID) === normalizedId
  );

  if (indexToUpdate !== -1) {
    const updatedTransaction = {
      /*
       * Preserve the original unique transaction ID. Users can update the
       * business fields, but the system-generated identifier remains stable.
       */
      trID: normalizedId,
      trDate: document.getElementById("tr-date").value,
      trCategory: document.getElementById("tr-category").value,
      trAmount: parseFloat(document.getElementById("tr-amount").value),
      trNotes: document.getElementById("tr-notes").value,
    };

    transactions[indexToUpdate] = updatedTransaction;

    /*
     * Re-normalize before saving as a defensive measure. This ensures that the
     * persisted data remains valid even if the in-memory array was externally
     * modified during the session.
     */
    transactions = ensureUniqueTransactionIds(transactions);
    saveTransactions(transactions);

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
