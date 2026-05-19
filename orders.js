
// function openSidebar() {
//     var side = document.getElementById('sidebar');
//     side.style.display = (side.style.display === "block") ? "none" : "block";
// }

// function closeSidebar() {
//     document.getElementById('sidebar').style.display = 'none';
// }


function openForm() {
    var form = document.getElementById("order-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("order-form").style.display = "none";
}

let orders = [];

window.onload = function () {
    const storedOrders = localStorage.getItem("bizTrackOrders");
    if (storedOrders) {
        orders = JSON.parse(storedOrders);
    } else {
        orders = [
        {
            orderID: "1001",
            orderDate: "2024-01-05",
            itemName: "Baseball caps",
            itemPrice: 25.00,
            qtyBought: 2,
            shipping: 2.50,
            taxes: 9.00,
            orderTotal: 61.50,
            orderStatus: "Pending"
        },
        {
            orderID: "1002",
            orderDate: "2024-03-05",
            itemName: "Water bottles",
            itemPrice: 17.00,
            qtyBought: 3,
            shipping: 3.50,
            taxes: 6.00,
            orderTotal: 60.50,
            orderStatus: "Processing"
        },
        {
            orderID: "1003",
            orderDate: "2024-02-05",
            itemName: "Tote bags",
            itemPrice: 20.00,
            qtyBought: 4,
            shipping: 2.50,
            taxes: 2.00,
            orderTotal: 84.50,
            orderStatus: "Shipped"
        },
        {
            orderID: "1004",
            orderDate: "2023-01-05",
            itemName: "Canvas prints",
            itemPrice: 55.00,
            qtyBought: 1,
            shipping: 2.50,
            taxes: 19.00,
            orderTotal: 76.50,
            orderStatus: "Delivered"
        },
        {
            orderID: "1005",
            orderDate: "2024-01-15",
            itemName: "Beanies",
            itemPrice: 15.00,
            qtyBought: 2,
            shipping: 3.90,
            taxes: 4.00,
            orderTotal: 37.90,
            orderStatus: "Pending"
        },
        ];

        localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
    }

    renderOrders(orders);
}

function addOrUpdate(event) {
    let type = document.getElementById("submitBtn").textContent;
    if (type === 'Add') {
        newOrder(event);
    } else if (type === 'Update'){
        const orderID = document.getElementById("order-id").value;
        updateOrder(orderID);
    }
}


function newOrder(event) {
  event.preventDefault();
  const orderID = document.getElementById("order-id").value;
  const orderDate = document.getElementById("order-date").value;
  const itemName = document.getElementById("item-name").value;
  const itemPrice = parseFloat(document.getElementById("item-price").value);
  const qtyBought = parseInt(document.getElementById("qty-bought").value);
  const shipping = parseFloat(document.getElementById("shipping").value);
  const taxes = parseFloat(document.getElementById("taxes").value);
  const orderTotal = ((itemPrice * qtyBought) + shipping + taxes);
  const orderStatus = document.getElementById("order-status").value;

  if (isDuplicateID(orderID, null)) {
    alert("Order ID already exists. Please use a unique ID.");
    return;
  }

  const order = {
    orderID,
    orderDate,
    itemName,
    itemPrice,
    qtyBought,
    shipping,
    taxes,
    orderTotal,
    orderStatus,
  };

  orders.push(order);

  renderOrders(orders);
  localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

  document.getElementById("order-form").reset();
}


function renderOrders(orders) {
  const orderTableBody = document.getElementById("tableBody");

  /*
   * SECURITY FIX:
   * The previous implementation rendered order rows through `innerHTML`.
   * Several order fields are user-controlled, especially `orderID`, because
   * it is entered through a free-text input. The old code also inserted
   * `orderID` into inline onclick handlers, creating a dangerous JavaScript
   * execution context.
   *
   * This implementation rebuilds rows with DOM APIs and inserts user data
   * through textContent only.
   */
  BizTrackSafeDOM.clearElement(orderTableBody);

  /*
   * Security rationale:
   * CSS classes should not be built directly from arbitrary user-controlled
   * data. Although the order status normally comes from a select element, data
   * stored in localStorage can be manually modified. This whitelist maps known
   * status labels to developer-controlled CSS class names.
   */
  const statusMap = {
    Pending: "pending",
    Processing: "processing",
    Shipped: "shipped",
    Delivered: "delivered",
  };

  orders.forEach((order) => {
    const orderRow = document.createElement("tr");
    orderRow.className = "order-row";

    orderRow.dataset.orderID = order.orderID;
    orderRow.dataset.orderDate = order.orderDate;
    orderRow.dataset.itemName = order.itemName;
    orderRow.dataset.itemPrice = order.itemPrice;
    orderRow.dataset.qtyBought = order.qtyBought;
    orderRow.dataset.shipping = order.shipping;
    orderRow.dataset.taxes = order.taxes;
    orderRow.dataset.orderTotal = order.orderTotal;
    orderRow.dataset.orderStatus = order.orderStatus;

    BizTrackSafeDOM.appendTextCell(orderRow, order.orderID);
    BizTrackSafeDOM.appendTextCell(orderRow, order.orderDate);
    BizTrackSafeDOM.appendTextCell(orderRow, order.itemName);
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.itemPrice)
    );
    BizTrackSafeDOM.appendTextCell(orderRow, order.qtyBought);
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.shipping)
    );
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.taxes)
    );
    BizTrackSafeDOM.appendTextCell(
      orderRow,
      BizTrackSafeDOM.formatCurrency(order.orderTotal),
      "order-total"
    );

    BizTrackSafeDOM.appendStatusCell(
      orderRow,
      order.orderStatus,
      statusMap[order.orderStatus] || ""
    );

    /*
     * SECURITY FIX:
     * Inline onclick handlers have been replaced with event listeners.
     * This prevents order IDs from being interpolated into executable
     * JavaScript code.
     */
    const editButton = BizTrackSafeDOM.createIconButton({
      label: `Edit order ${BizTrackSafeDOM.toDisplayText(order.orderID)}`,
      title: "Edit",
      iconClassName: "fa-solid fa-pen-to-square",
      className: "icon-button edit-icon",
      onClick: () => editRow(order.orderID),
    });

    const deleteButton = BizTrackSafeDOM.createIconButton({
      label: `Delete order ${BizTrackSafeDOM.toDisplayText(order.orderID)}`,
      title: "Delete",
      iconClassName: "fas fa-trash-alt",
      className: "icon-button delete-icon",
      onClick: () => deleteOrder(order.orderID),
    });

    BizTrackSafeDOM.appendActionCell(orderRow, [editButton, deleteButton]);

    orderTableBody.appendChild(orderRow);
  });

  displayRevenue();
}


function displayRevenue() {
  const resultElement = document.getElementById("total-revenue");

  /*
   * SECURITY FIX:
   * Although totalRevenue is calculated numerically, this function now follows
   * the same safe rendering convention as the table rows: DOM nodes are created
   * explicitly and text is inserted through textContent.
   */
  const totalRevenue = orders.reduce(
    (total, order) => total + Number(order.orderTotal || 0),
    0
  );

  BizTrackSafeDOM.setSingleTextSpan(
    resultElement,
    `Total Revenue: $${totalRevenue.toFixed(2)}`
  );
}

function editRow(orderID) {
    const orderToEdit = orders.find(order => order.orderID === orderID);

    document.getElementById("order-id").value = orderToEdit.orderID;
    document.getElementById("order-date").value = orderToEdit.orderDate;
    document.getElementById("item-name").value = orderToEdit.itemName;
    document.getElementById("item-price").value = orderToEdit.itemPrice;
    document.getElementById("qty-bought").value = orderToEdit.qtyBought;
    document.getElementById("shipping").value = orderToEdit.shipping;
    document.getElementById("taxes").value = orderToEdit.taxes;
    document.getElementById("order-total").value = orderToEdit.orderTotal;
    document.getElementById("order-status").value = orderToEdit.orderStatus;

    document.getElementById("submitBtn").textContent = "Update";

    document.getElementById("order-form").style.display = "block";
}

function deleteOrder(orderID) {
  const indexToDelete = orders.findIndex(order => order.orderID === orderID);

  if (indexToDelete !== -1) {
      orders.splice(indexToDelete, 1);

      localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

      renderOrders(orders);
  }
}

function updateOrder(orderID) {
    const indexToUpdate = orders.findIndex(order => order.orderID === orderID);

    if (indexToUpdate !== -1) {
        const itemPrice = parseFloat(document.getElementById("item-price").value);
        const qtyBought = parseInt(document.getElementById("qty-bought").value);
        const shipping = parseFloat(document.getElementById("shipping").value);
        const taxes = parseFloat(document.getElementById("taxes").value);
        const updatedOrder = {
            orderID: document.getElementById("order-id").value,
            orderDate: document.getElementById("order-date").value,
            itemName: document.getElementById("item-name").value,
            itemPrice: itemPrice,
            qtyBought: qtyBought,
            shipping: shipping,
            taxes: taxes,
            orderTotal: ((itemPrice * qtyBought) + shipping + taxes),
            orderStatus: document.getElementById("order-status").value,
        };

        if (isDuplicateID(updatedOrder.orderID, orderID)) {
            alert("Order ID already exists. Please use a unique ID.");
            return;
        }

        orders[indexToUpdate] = updatedOrder;

        localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

        renderOrders(orders);

        document.getElementById("order-form").reset();
        document.getElementById("submitBtn").textContent = "Add";
    }
}

function isDuplicateID(orderID, currentID) {
    return orders.some(order => order.orderID === orderID && order.orderID !== currentID);
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "itemPrice" || column === "qtyBought" || column === "shipping"|| column === "taxes"|| column === "orderTotal";

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
    const rows = document.querySelectorAll(".order-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


function exportToCSV() {
  /*
   * CSV ROBUSTNESS FIX:
   * The export schema is now explicit. This prevents crashes when the orders
   * array is empty and keeps the exported column order stable over time.
   */
  const orderColumns = [
    {
      header: "Order ID",
      value: (order) => order.orderID,
    },
    {
      header: "Order Date",
      value: (order) => order.orderDate,
    },
    {
      header: "Item Name",
      value: (order) => order.itemName,
    },
    {
      header: "Item Price",
      value: (order) => Number(order.itemPrice || 0).toFixed(2),
    },
    {
      header: "Quantity Bought",
      value: (order) => order.qtyBought,
    },
    {
      header: "Shipping Fee",
      value: (order) => Number(order.shipping || 0).toFixed(2),
    },
    {
      header: "Taxes",
      value: (order) => Number(order.taxes || 0).toFixed(2),
    },
    {
      header: "Order Total",
      value: (order) => Number(order.orderTotal || 0).toFixed(2),
    },
    {
      header: "Order Status",
      value: (order) => order.orderStatus,
    },
  ];

  /*
   * SECURITY FIX:
   * Order ID is a free-text field and therefore user-controlled. The shared
   * CSV utility escapes every cell and prefixes formula-like values so that
   * exported spreadsheet cells are treated as text rather than formulas.
   */
  BizTrackCSV.exportRecordsToCSV({
    filename: "biztrack_order_table.csv",
    records: orders,
    columns: orderColumns,
  });
}

