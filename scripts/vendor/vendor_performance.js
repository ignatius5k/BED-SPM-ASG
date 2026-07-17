const API_URL = "http://localhost:3000/vendor-performance";

// =========================================================
// MOCK PREVIEW DATA
// Only used when the page URL ends with ?mock=true.
// The normal dashboard still requests data from MSSQL.
// =========================================================
const MOCK_PERFORMANCE = {
  stalls: [{ stallId: "STALL001", stallName: "Ben's Chicken Rice" }],
  summary: {
    dailySales: 27.5,
    totalOrders: 3,
    averageOrderValue: 9.17,
  },
  monthly: [
    { monthLabel: "Jan 2026", totalOrders: 24, revenue: 158.0 },
    { monthLabel: "Feb 2026", totalOrders: 32, revenue: 210.0 },
    { monthLabel: "Mar 2026", totalOrders: 29, revenue: 191.5 },
    { monthLabel: "Apr 2026", totalOrders: 41, revenue: 275.0 },
    { monthLabel: "May 2026", totalOrders: 38, revenue: 252.0 },
    { monthLabel: "Jun 2026", totalOrders: 46, revenue: 310.5 },
    { monthLabel: "Jul 2026", totalOrders: 53, revenue: 365.0 },
  ],
  items: [
    { itemName: "Steamed Chicken Rice", quantitySold: 72, revenue: 396.0 },
    { itemName: "Lime Juice", quantitySold: 54, revenue: 108.0 },
    { itemName: "Roasted Chicken Rice", quantitySold: 48, revenue: 288.0 },
    { itemName: "Fried Rice", quantitySold: 31, revenue: 155.0 },
    { itemName: "Chicken Soup", quantitySold: 18, revenue: 54.0 },
  ],
};

let ordersChart = null;
let revenueChart = null;

// =========================================================
// STEP 1: Small display helpers
// =========================================================
function formatCurrency(value) {
  const amount = Number(value || 0);
  return `S$${amount.toFixed(2)}`;
}

function showMessage(message, isError = false) {
  const messageElement = document.getElementById("performanceMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

// =========================================================
// STEP 2: Fill the cards and stall name
// =========================================================
function displaySummary(data) {
  const stallNames = data.stalls.map((stall) => stall.stallName);

  document.getElementById("stallNameBadge").textContent = stallNames.join(", ");
  document.getElementById("totalOrders").textContent = Number(
    data.summary.totalOrders || 0
  ).toLocaleString();
  document.getElementById("dailySales").textContent = formatCurrency(
    data.summary.dailySales
  );
  document.getElementById("averageOrderValue").textContent = formatCurrency(
    data.summary.averageOrderValue
  );
}

// =========================================================
// STEP 3: Draw order and revenue charts
// =========================================================
function displayCharts(monthlyData) {
  if (typeof Chart === "undefined") {
    showMessage("The chart library could not be loaded.", true);
    return false;
  }

  const labels = monthlyData.map((month) => month.monthLabel);
  const orders = monthlyData.map((month) => Number(month.totalOrders));
  const revenue = monthlyData.map((month) => Number(month.revenue));
  const isSmallScreen = window.matchMedia("(max-width: 600px)").matches;

  Chart.defaults.font.family = '"DM Sans", Arial, sans-serif';
  Chart.defaults.color = "#686861";

  if (ordersChart) {
    ordersChart.destroy();
  }

  if (revenueChart) {
    revenueChart.destroy();
  }

  ordersChart = new Chart(document.getElementById("ordersChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Orders",
          data: orders,
          backgroundColor: "rgba(173, 52, 62, 0.78)",
          hoverBackgroundColor: "#8f2f36",
          borderRadius: 5,
          maxBarThickness: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            maxTicksLimit: isSmallScreen ? 4 : 7,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#eceee7" },
          border: { display: false },
          ticks: { precision: 0 },
        },
      },
    },
  });

  revenueChart = new Chart(document.getElementById("revenueChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Revenue",
          data: revenue,
          borderColor: "#ad343e",
          borderWidth: 2.5,
          fill: false,
          tension: 0,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#ad343e",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` Revenue: ${formatCurrency(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            maxTicksLimit: isSmallScreen ? 4 : 7,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#eceee7" },
          border: { display: false },
          ticks: {
            callback: function (value) {
              return `S$${value}`;
            },
          },
        },
      },
    },
  });

  return true;
}

// =========================================================
// STEP 4: Show best-selling and least-selling menu items
// =========================================================
function createItemRow(item, rank, label) {
  const row = document.createElement("tr");

  const rankCell = document.createElement("td");
  rankCell.className = "rank-number";
  rankCell.textContent = rank;

  const nameCell = document.createElement("td");
  nameCell.className = "item-name";
  nameCell.textContent = item.itemName;

  const quantityCell = document.createElement("td");
  quantityCell.className = "item-quantity";
  quantityCell.textContent = Number(item.quantitySold || 0).toLocaleString();

  const revenueCell = document.createElement("td");
  revenueCell.className = "item-revenue-value";
  revenueCell.textContent = formatCurrency(item.revenue);

  const resultCell = document.createElement("td");

  if (label) {
    const status = document.createElement("span");
    status.className = "performance-status";
    status.textContent = label;

    if (label === "Best seller" || label === "Only item") {
      status.classList.add("best");
    }

    resultCell.appendChild(status);
  } else {
    resultCell.textContent = "-";
  }

  row.appendChild(rankCell);
  row.appendChild(nameCell);
  row.appendChild(quantityCell);
  row.appendChild(revenueCell);
  row.appendChild(resultCell);

  return row;
}

function displayItems(items) {
  const itemsList = document.getElementById("itemsList");
  itemsList.innerHTML = "";

  if (items.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "table-empty";
    cell.textContent = "No menu items were found for this vendor.";
    row.appendChild(cell);
    itemsList.appendChild(row);
    return;
  }

  items.forEach((item, index) => {
    let label = "";

    if (items.length === 1) {
      label = "Only item";
    } else if (index === 0) {
      label = "Best seller";
    } else if (index === items.length - 1) {
      label = "Lowest seller";
    }

    const row = createItemRow(item, index + 1, label);
    itemsList.appendChild(row);
  });
}

// =========================================================
// STEP 5: Request the logged-in vendor's SQL performance data
// =========================================================
async function loadPerformance() {
  const query = new URLSearchParams(window.location.search);

  if (query.get("mock") === "true") {
    displaySummary(MOCK_PERFORMANCE);
    const chartsLoaded = displayCharts(MOCK_PERFORMANCE.monthly);
    displayItems(MOCK_PERFORMANCE.items);

    if (chartsLoaded) {
      showMessage("Mock preview data. Connect MSSQL for the live dashboard.");
    }

    return;
  }

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "vendor") {
    showMessage("Please log in with a vendor account to view this dashboard.", true);
    return;
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load performance data");
    }

    displaySummary(data);
    const chartsLoaded = displayCharts(data.monthly);
    displayItems(data.items);

    if (chartsLoaded) {
      showMessage("Performance data loaded from MSSQL.");
    }
  } catch (error) {
    console.error("Performance dashboard error:", error);
    showMessage(error.message, true);
  }
}

document.addEventListener("DOMContentLoaded", loadPerformance);
