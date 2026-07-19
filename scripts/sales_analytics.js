const SALES_ANALYTICS_API = "http://localhost:3000/sales-analytics";

// =========================================================
// MOCK PREVIEW DATA
// Used automatically on Live Server, or when the URL includes ?mock=true.
// Add ?mock=false to test the real MSSQL flow.
// =========================================================
const MOCK_SALES_ANALYTICS = {
  popularItems: [
    {
      itemName: "Steamed Chicken Rice",
      stallName: "Ben's Chicken Rice",
      cuisine: "Chinese",
      price: 5.5,
      quantitySold: 7,
    },
    {
      itemName: "Lime Juice",
      stallName: "Ben's Chicken Rice",
      cuisine: "Chinese",
      price: 2.0,
      quantitySold: 5,
    },
    {
      itemName: "Roasted Chicken Rice",
      stallName: "Ben's Chicken Rice",
      cuisine: "Chinese",
      price: 6.0,
      quantitySold: 4,
    },
    {
      itemName: "Fried Rice",
      stallName: "Ben's Chicken Rice",
      cuisine: "Chinese",
      price: 5.0,
      quantitySold: 3,
    },
    {
      itemName: "Chicken Soup",
      stallName: "Ben's Chicken Rice",
      cuisine: "Chinese",
      price: 3.0,
      quantitySold: 2,
    },
  ],
  peakHours: [
    { hourOfDay: 8, totalOrders: 1, totalSales: 11.0 },
    { hourOfDay: 12, totalOrders: 5, totalSales: 39.0 },
    { hourOfDay: 13, totalOrders: 1, totalSales: 16.5 },
    { hourOfDay: 18, totalOrders: 2, totalSales: 15.5 },
    { hourOfDay: 19, totalOrders: 1, totalSales: 11.5 },
  ],
  busiestHour: { hourOfDay: 12, totalOrders: 5, totalSales: 39.0 },
};

let peakHoursChart = null;

// =========================================================
// STEP 1: Small display helpers
// =========================================================
function formatCurrency(value) {
  const amount = Number(value || 0);
  return `S$${amount.toFixed(2)}`;
}

function formatHour(hour) {
  const safeHour = Number(hour || 0);
  const period = safeHour >= 12 ? "PM" : "AM";
  const displayHour = safeHour % 12 === 0 ? 12 : safeHour % 12;

  return `${displayHour} ${period}`;
}

function showAnalyticsMessage(message, isError = false) {
  const messageElement = document.getElementById("analyticsMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

// =========================================================
// STEP 2: Display the five most popular menu items
// =========================================================
function createPopularItem(item, rank) {
  const card = document.createElement("div");
  card.className = "popular-item";

  const rankElement = document.createElement("span");
  rankElement.className = "item-rank";
  rankElement.textContent = rank;

  const details = document.createElement("div");
  details.className = "item-details";

  const name = document.createElement("h5");
  name.textContent = item.itemName;

  const stall = document.createElement("p");
  stall.textContent = `${item.stallName} · ${item.cuisine || "Hawker food"}`;

  details.appendChild(name);
  details.appendChild(stall);

  const price = document.createElement("div");
  price.className = "item-price";

  const priceValue = document.createElement("strong");
  priceValue.textContent = formatCurrency(item.price);

  const quantity = document.createElement("span");
  quantity.textContent = `${Number(item.quantitySold || 0)} sold`;

  price.appendChild(priceValue);
  price.appendChild(quantity);

  card.appendChild(rankElement);
  card.appendChild(details);
  card.appendChild(price);

  return card;
}

function displayPopularItems(items) {
  const container = document.getElementById("popularItems");
  container.innerHTML = "";

  if (!items || items.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "popular-empty";
    emptyMessage.textContent = "Popular items will appear after completed orders.";
    container.appendChild(emptyMessage);
    return;
  }

  for (let i = 0; i < items.length; i += 1) {
    container.appendChild(createPopularItem(items[i], i + 1));
  }
}

// =========================================================
// STEP 3: Display the busiest hour and draw the order chart
// =========================================================
function displayBusiestHour(busiestHour) {
  const hourElement = document.getElementById("busiestHour");
  const orderElement = document.getElementById("busiestOrderCount");

  if (!busiestHour) {
    hourElement.textContent = "No data";
    orderElement.textContent = "No completed orders yet";
    return;
  }

  hourElement.textContent = formatHour(busiestHour.hourOfDay);
  orderElement.textContent = `${Number(
    busiestHour.totalOrders || 0
  )} completed orders recorded`;
}

function displayPeakHoursChart(peakHours) {
  if (typeof Chart === "undefined") {
    showAnalyticsMessage("The chart library could not be loaded.", true);
    return false;
  }

  if (peakHoursChart) {
    peakHoursChart.destroy();
  }

  const labels = peakHours.map((hour) => formatHour(hour.hourOfDay));
  const orderCounts = peakHours.map((hour) => Number(hour.totalOrders || 0));

  Chart.defaults.font.family = '"DM Sans", Arial, sans-serif';
  Chart.defaults.color = "#686861";

  peakHoursChart = new Chart(document.getElementById("peakHoursChart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Orders",
          data: orderCounts,
          backgroundColor: "rgba(173, 52, 62, 0.78)",
          hoverBackgroundColor: "#8F2F36",
          borderRadius: 5,
          maxBarThickness: 28,
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
          ticks: { maxRotation: 0, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#ECEEE7" },
          border: { display: false },
          ticks: { precision: 0 },
        },
      },
    },
  });

  return true;
}

// =========================================================
// STEP 4: Request public sales analytics for the home page
// =========================================================
async function loadSalesAnalytics() {
  const query = new URLSearchParams(window.location.search);
  const mockPreference = query.get("mock");
  const isLiveServerPreview = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname
  );
  const mockMode =
    mockPreference === "true" ||
    query.get("mockAnalytics") === "true" ||
    (mockPreference !== "false" && isLiveServerPreview);

  if (mockMode) {
    displayPopularItems(MOCK_SALES_ANALYTICS.popularItems);
    displayBusiestHour(MOCK_SALES_ANALYTICS.busiestHour);
    const chartLoaded = displayPeakHoursChart(MOCK_SALES_ANALYTICS.peakHours);

    if (chartLoaded) {
      showAnalyticsMessage("Presentation data from the current sample dataset.");
    }

    return;
  }

  try {
    const response = await fetch(SALES_ANALYTICS_API);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load sales analytics");
    }

    displayPopularItems(data.popularItems);
    displayBusiestHour(data.busiestHour);
    const chartLoaded = displayPeakHoursChart(data.peakHours);

    if (chartLoaded) {
      showAnalyticsMessage("Popular dishes and busy times loaded from MSSQL.");
    }
  } catch (error) {
    console.error("Sales analytics error:", error);
    displayPopularItems([]);
    displayBusiestHour(null);
    showAnalyticsMessage(
      "Sales trends are temporarily unavailable. Please try again later.",
      true
    );
  }
}

document.addEventListener("DOMContentLoaded", loadSalesAnalytics);
