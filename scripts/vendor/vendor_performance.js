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
    {
      monthStart: "2025-08-01",
      monthLabel: "Aug 2025",
      totalOrders: 18,
      revenue: 121.5,
    },
    {
      monthStart: "2025-09-01",
      monthLabel: "Sep 2025",
      totalOrders: 22,
      revenue: 148.0,
    },
    {
      monthStart: "2025-10-01",
      monthLabel: "Oct 2025",
      totalOrders: 20,
      revenue: 137.5,
    },
    {
      monthStart: "2025-11-01",
      monthLabel: "Nov 2025",
      totalOrders: 27,
      revenue: 184.0,
    },
    {
      monthStart: "2025-12-01",
      monthLabel: "Dec 2025",
      totalOrders: 35,
      revenue: 238.5,
    },
    {
      monthStart: "2026-01-01",
      monthLabel: "Jan 2026",
      totalOrders: 24,
      revenue: 158.0,
    },
    {
      monthStart: "2026-02-01",
      monthLabel: "Feb 2026",
      totalOrders: 32,
      revenue: 210.0,
    },
    {
      monthStart: "2026-03-01",
      monthLabel: "Mar 2026",
      totalOrders: 29,
      revenue: 191.5,
    },
    {
      monthStart: "2026-04-01",
      monthLabel: "Apr 2026",
      totalOrders: 41,
      revenue: 275.0,
    },
    {
      monthStart: "2026-05-01",
      monthLabel: "May 2026",
      totalOrders: 38,
      revenue: 252.0,
    },
    {
      monthStart: "2026-06-01",
      monthLabel: "Jun 2026",
      totalOrders: 46,
      revenue: 310.5,
    },
    {
      monthStart: "2026-07-01",
      monthLabel: "Jul 2026",
      totalOrders: 56,
      revenue: 392.5,
    },
  ],
  // Weekly rows let the 1-month line show movement instead of one point.
  weekly: [
    {
      monthStart: "2026-07-01",
      monthLabel: "1 Jul - 7 Jul",
      totalOrders: 20,
      revenue: 138.0,
    },
    {
      monthStart: "2026-07-08",
      monthLabel: "8 Jul - 14 Jul",
      totalOrders: 23,
      revenue: 156.0,
    },
    {
      monthStart: "2026-07-15",
      monthLabel: "15 Jul - 18 Jul",
      totalOrders: 13,
      revenue: 98.5,
    },
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
let mockMode = false;

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

function showDateFilterMessage(message, isError = false) {
  const messageElement = document.getElementById("dateFilterMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);

  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPresetDateRange(monthCount) {
  const endDate = new Date();
  const startDate = new Date(
    endDate.getFullYear(),
    endDate.getMonth() - (monthCount - 1),
    1
  );

  return {
    startDate: formatInputDate(startDate),
    endDate: formatInputDate(endDate),
    label: monthCount === 1 ? "This month" : `Last ${monthCount} months`,
    granularity: monthCount === 1 ? "week" : "month",
  };
}

function setRangeButtonsLoading(isLoading) {
  const buttons = document.querySelectorAll(".range-button");
  buttons.forEach((button) => {
    button.disabled = isLoading;
  });
}

function updatePeriodLabel(dateRange) {
  const periodLabel = document.getElementById("periodLabel");
  const isWeekly = dateRange.granularity === "week";

  periodLabel.textContent = dateRange.label;
  document.getElementById("revenueChartSubtitle").textContent = isWeekly
    ? "Paid and completed sales by week"
    : "Paid and completed sales by month";
  document.getElementById("ordersChartSubtitle").textContent = isWeekly
    ? "Orders completed by week"
    : "Orders completed by month";
  document
    .getElementById("revenueChart")
    .setAttribute("aria-label", isWeekly ? "Weekly revenue line chart" : "Monthly revenue line chart");
  document
    .getElementById("ordersChart")
    .setAttribute("aria-label", isWeekly ? "Weekly order volume bar chart" : "Monthly order volume bar chart");
  showDateFilterMessage(
    `Showing ${formatDisplayDate(
      dateRange.startDate
    )} to ${formatDisplayDate(dateRange.endDate)}.`
  );
}

function getMockTrendData(dateRange) {
  if (dateRange.granularity === "week") {
    return MOCK_PERFORMANCE.weekly.filter((week) => {
      return (
        week.monthStart >= dateRange.startDate &&
        week.monthStart <= dateRange.endDate
      );
    });
  }

  const firstMonth = dateRange.startDate.slice(0, 7);
  const lastMonth = dateRange.endDate.slice(0, 7);

  return MOCK_PERFORMANCE.monthly.filter((month) => {
    const currentMonth = month.monthStart.slice(0, 7);
    return currentMonth >= firstMonth && currentMonth <= lastMonth;
  });
}

function fillMissingWeeklyData(trendData, dateRange) {
  if (dateRange.granularity !== "week") {
    return trendData;
  }

  const rowsByDate = new Map();
  trendData.forEach((row) => {
    const dateKey = String(row.monthStart).slice(0, 10);
    rowsByDate.set(dateKey, row);
  });

  const completedRows = [];
  const currentWeek = new Date(`${dateRange.startDate}T00:00:00Z`);
  const finalDate = new Date(`${dateRange.endDate}T00:00:00Z`);

  while (currentWeek <= finalDate) {
    const dateKey = currentWeek.toISOString().slice(0, 10);
    const existingRow = rowsByDate.get(dateKey);
    const weekEnd = new Date(currentWeek);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    if (weekEnd > finalDate) {
      weekEnd.setTime(finalDate.getTime());
    }

    if (existingRow) {
      completedRows.push(existingRow);
    } else {
      completedRows.push({
        monthStart: dateKey,
        monthLabel: `${currentWeek.toLocaleDateString("en-SG", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })} - ${weekEnd.toLocaleDateString("en-SG", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })}`,
        totalOrders: 0,
        revenue: 0,
      });
    }

    currentWeek.setUTCDate(currentWeek.getUTCDate() + 7);
  }

  return completedRows;
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
function displayCharts(trendData) {
  if (typeof Chart === "undefined") {
    showMessage("The chart library could not be loaded.", true);
    return false;
  }

  if (ordersChart) {
    ordersChart.destroy();
    ordersChart = null;
  }

  if (revenueChart) {
    revenueChart.destroy();
    revenueChart = null;
  }

  const revenueCanvas = document.getElementById("revenueChart");
  const ordersCanvas = document.getElementById("ordersChart");
  const revenueEmpty = document.getElementById("revenueChartEmpty");
  const ordersEmpty = document.getElementById("ordersChartEmpty");
  const hasChartData = trendData.length > 0;

  revenueCanvas.hidden = !hasChartData;
  ordersCanvas.hidden = !hasChartData;
  revenueEmpty.hidden = hasChartData;
  ordersEmpty.hidden = hasChartData;

  if (!hasChartData) {
    return true;
  }

  const labels = trendData.map((period) => period.monthLabel);
  const orders = trendData.map((period) => Number(period.totalOrders));
  const revenue = trendData.map((period) => Number(period.revenue));
  const isSmallScreen = window.matchMedia("(max-width: 600px)").matches;

  Chart.defaults.font.family = '"DM Sans", Arial, sans-serif';
  Chart.defaults.color = "#686861";

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
async function loadPerformance(dateRange) {
  const query = new URLSearchParams(window.location.search);
  mockMode = query.get("mock") === "true";

  if (mockMode) {
    const trendData = fillMissingWeeklyData(getMockTrendData(dateRange), dateRange);

    displaySummary(MOCK_PERFORMANCE);
    const chartsLoaded = displayCharts(trendData);
    displayItems(MOCK_PERFORMANCE.items);
    updatePeriodLabel(dateRange);

    if (trendData.length === 0) {
      showDateFilterMessage("No mock sales were found for this period.");
    }

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
    const requestUrl = new URL(API_URL);

    requestUrl.searchParams.set("startDate", dateRange.startDate);
    requestUrl.searchParams.set("endDate", dateRange.endDate);

    setRangeButtonsLoading(true);

    const response = await fetch(requestUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load performance data");
    }

    const trendData = fillMissingWeeklyData(data.monthly, dateRange);

    displaySummary(data);
    const chartsLoaded = displayCharts(trendData);
    displayItems(data.items);
    updatePeriodLabel(dateRange);

    if (data.monthly.length === 0) {
      showDateFilterMessage(
        "No paid or completed orders were found for this period."
      );
    }

    if (chartsLoaded) {
      showMessage("Performance data loaded from MSSQL.");
    }
  } catch (error) {
    console.error("Performance dashboard error:", error);
    showMessage(error.message, true);
  } finally {
    setRangeButtonsLoading(false);
  }
}

function selectChartPeriod(event) {
  const selectedButton = event.currentTarget;
  const monthCount = Number(selectedButton.dataset.months);
  const dateRange = getPresetDateRange(monthCount);

  document.querySelectorAll(".range-button").forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  showDateFilterMessage(`Updating charts for ${dateRange.label.toLowerCase()}...`);
  loadPerformance(dateRange);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".range-button").forEach((button) => {
    button.addEventListener("click", selectChartPeriod);
  });

  loadPerformance(getPresetDateRange(6));
});
