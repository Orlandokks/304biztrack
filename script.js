// SIDEBAR TOGGLE

// function openSidebar() {
//   var side = document.getElementById('sidebar');
//   side.style.display = (side.style.display === "block") ? "none" : "block";
// }

// function closeSidebar() {
//   document.getElementById('sidebar').style.display = 'none';
// }


window.onload = function () {
  const expenses = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [
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
  const revenues = JSON.parse(localStorage.getItem('bizTrackOrders')) || [
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

  const totalExpenses = calculateExpTotal(expenses);
  const totalRevenues = calculateRevTotal(revenues);
  const totalBalance = totalRevenues - totalExpenses;
  const numOrders = revenues.length;

  const revDiv = document.getElementById('rev-amount');
  const expDiv = document.getElementById('exp-amount');
  const balDiv = document.getElementById('balance');
  const ordDiv = document.getElementById('num-orders');

  revDiv.innerHTML = `
      <span class="title">Revenue</span>
      <span class="amount-value">$${totalRevenues.toFixed(2)}</span> 
  `;

  expDiv.innerHTML = `
    <span class="title">Expenses</span>
    <span class="amount-value">$${totalExpenses.toFixed(2)}</span>
  `;

  balDiv.innerHTML = `
    <span class="title">Balance</span>
    <span class="amount-value">$${totalBalance.toFixed(2)}</span>
  `;

  ordDiv.innerHTML = `
    <span class="title">Orders</span>
    <span class="amount-value">${numOrders}</span>
  `;
};

function calculateExpTotal(transactions) {
  return transactions.reduce((total, transaction) => total + transaction.trAmount, 0);
}
function calculateRevTotal(orders) {
  return orders.reduce((total, order) => total + order.orderTotal, 0);
}


// ---------- CHARTS ----------

// BAR CHART

function calculateCategorySales(products) {
  const categorySales = {};

  products.forEach(product => {
    const category = product.prodCat;

    if (!categorySales[category]) {
      categorySales[category] = 0;
    }

    categorySales[category] += product.prodPrice * product.prodSold;
  });

  return categorySales;
}


function initializeChart() {
  const items = JSON.parse(localStorage.getItem('bizTrackProducts')) || [
    {
      prodID: "PD001",
      prodName: "Baseball caps",
      prodDesc: "Peace embroidered cap",
      prodCat: "Hats",
      prodPrice: 25.00,
      prodSold: 20
    },
    {
      prodID: "PD002",
      prodName: "Water bottles",
      prodDesc: "Floral lotus printed bottle",
      prodCat: "Drinkware",
      prodPrice: 48.50,
      prodSold: 10
    },
    {
      prodID: "PD003",
      prodName: "Sweatshirt",
      prodDesc: "Palestine sweater",
      prodCat: "Clothing",
      prodPrice: 17.50,
      prodSold: 70
    },
    {
      prodID: "PD004",
      prodName: "Posters",
      prodDesc: "Vibes printed poster",
      prodCat: "Home decor",
      prodPrice: 12.00,
      prodSold: 60
    },
    {
      prodID: "PD005",
      prodName: "Pillow cases",
      prodDesc: "Morrocan print pillow case",
      prodCat: "Accessories",
      prodPrice: 17.00,
      prodSold: 40
    },
  ];
  const categorySalesData = calculateCategorySales(items);

  const sortedCategorySales = Object.entries(categorySalesData)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  const barChartOptions = {
      series: [{
          name: "Total Sales",
          data: Object.values(sortedCategorySales),
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {show: false},
      },
      theme: {
        palette: 'palette9' // upto palette10
      },
      // colors: ['#247BA0', '#A37A74', '#249672', '#e49273', '#9AADBF'],
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 3,
          horizontal: false,
          columnWidth: '50%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      fill: {
        opacity: 0.7,
      },
      xaxis: {
        categories: Object.keys(sortedCategorySales),
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        title: {
          text: 'Total Sales ($)',
        },
        axisTicks: {
          show: false,
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return '$' + val.toFixed(2);
          }
        }
      }
    };
    
  const barChart = new ApexCharts(
    document.querySelector('#bar-chart'), barChartOptions
  );
  barChart.render();


  // DONUT CHART

  function calculateCategoryExp(transactions) {
    const categoryExpenses = {};

    transactions.forEach(transaction => {
      const category = transaction.trCategory;

      if (!categoryExpenses[category]) {
        categoryExpenses[category] = 0;
      }

      categoryExpenses[category] += transaction.trAmount;
    });

    return categoryExpenses;
  }

  const expItems = JSON.parse(localStorage.getItem('bizTrackTransactions')) || [
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
  const categoryExpData = calculateCategoryExp(expItems);

  const donutChartOptions = {
    series: Object.values(categoryExpData),
    labels: Object.keys(categoryExpData),
    chart: {
      // height: 350,
      type: 'donut',
      width: '100%',
      toolbar: {
        show: false,
      },
    },
    theme: {
      palette: 'palette1' // upto palette10
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Loto, sans-serif',
        fontWeight: 'regular',
      },
    },
    plotOptions: {
      pie: {
        customScale: 0.8,
        donut: {
          size: '60%',
        },
        offsetY: 20,
      },
      stroke: {
        colors: undefined
      }
    },
    legend: {
      position: 'left',
      offsetY: 55,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return '$' + val.toFixed(2);
        }
      }
    },
  };
  
  const donutChart = new ApexCharts(
    document.querySelector('#donut-chart'),
    donutChartOptions
  );
  donutChart.render();
};