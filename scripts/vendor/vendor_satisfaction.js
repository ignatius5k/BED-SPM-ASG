const API_URL = "http://localhost:3000/vendor-satisfaction";

// =========================================================
// MOCK PREVIEW DATA
// Used automatically on Live Server, or when the URL includes ?mock=true.
// Add ?mock=false to test the real login/API flow.
// All cards, charts, category counts, and lists are calculated
// from these same rows so the displayed numbers always tally.
// =========================================================
function createMonthDate(monthsAgo, dayOfMonth) {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
  const latestAllowedDay = monthsAgo === 0 ? today.getDate() : 28;
  date.setDate(Math.min(dayOfMonth, latestAllowedDay));
  return date.toISOString().slice(0, 10);
}

const MOCK_FEEDBACK = [
  { feedbackId: 1, customerName: "alicetan", stallName: "Ben's Chicken Rice", rating: 5, comments: "Chicken was tender and the rice was fragrant.", feedbackDate: createMonthDate(0, 2) },
  { feedbackId: 2, customerName: "davidlim", stallName: "Ben's Chicken Rice", rating: 4, comments: "Good portion and quick collection.", feedbackDate: createMonthDate(0, 7) },
  { feedbackId: 3, customerName: "emilyong", stallName: "Ben's Chicken Rice", rating: 5, comments: "Friendly service and excellent chilli.", feedbackDate: createMonthDate(0, 13) },
  { feedbackId: 4, customerName: "faridhassan", stallName: "Ben's Chicken Rice", rating: 3, comments: "Food was good but the queue moved slowly.", feedbackDate: createMonthDate(0, 18) },
  { feedbackId: 5, customerName: "graceyeo", stallName: "Ben's Chicken Rice", rating: 4, comments: "Roasted chicken was flavourful.", feedbackDate: createMonthDate(1, 6) },
  { feedbackId: 6, customerName: "haikalrahman", stallName: "Ben's Chicken Rice", rating: 5, comments: "Consistently tasty and well packed.", feedbackDate: createMonthDate(1, 17) },
  { feedbackId: 7, customerName: "ivylow", stallName: "Ben's Chicken Rice", rating: 4, comments: "Lime juice was fresh and not too sweet.", feedbackDate: createMonthDate(2, 8) },
  { feedbackId: 8, customerName: "jasonchua", stallName: "Ben's Chicken Rice", rating: 2, comments: "Rice was slightly dry during the evening.", feedbackDate: createMonthDate(2, 21) },
  { feedbackId: 9, customerName: "kellytan", stallName: "Ben's Chicken Rice", rating: 5, comments: "Excellent value for the portion.", feedbackDate: createMonthDate(3, 11) },
  { feedbackId: 10, customerName: "leonardooi", stallName: "Ben's Chicken Rice", rating: 4, comments: "Fast service during lunch.", feedbackDate: createMonthDate(4, 14) },
  { feedbackId: 11, customerName: "michellewong", stallName: "Ben's Chicken Rice", rating: 3, comments: "Soup could have been warmer.", feedbackDate: createMonthDate(5, 9) },
  { feedbackId: 12, customerName: "nabilahsalim", stallName: "Ben's Chicken Rice", rating: 5, comments: "One of my favourite chicken rice stalls.", feedbackDate: createMonthDate(6, 19) },
  { feedbackId: 13, customerName: "oscartay", stallName: "Ben's Chicken Rice", rating: 4, comments: "Reliable meal and polite staff.", feedbackDate: createMonthDate(8, 12) },
  { feedbackId: 14, customerName: "priyasharma", stallName: "Ben's Chicken Rice", rating: 3, comments: "Waiting time was longer than expected.", feedbackDate: createMonthDate(10, 16) },
  { feedbackId: 15, customerName: "quekweiliang", stallName: "Ben's Chicken Rice", rating: 5, comments: "The roasted chicken was excellent.", feedbackDate: createMonthDate(11, 7) },
];

const MOCK_COMPLAINTS = [
  { complaintId: 1, customerName: "rachelfoo", stallName: "Ben's Chicken Rice", category: "Food Quality", description: "The chicken was colder than expected.", status: "pending", complaintDate: createMonthDate(0, 3) },
  { complaintId: 2, customerName: "samuelgoh", stallName: "Ben's Chicken Rice", category: "Service Quality", description: "My collection number was skipped.", status: "resolved", complaintDate: createMonthDate(0, 8) },
  { complaintId: 3, customerName: "tanyapillai", stallName: "Ben's Chicken Rice", category: "Waiting Time", description: "The lunch queue took more than twenty minutes.", status: "in progress", complaintDate: createMonthDate(0, 15) },
  { complaintId: 4, customerName: "umarzaki", stallName: "Ben's Chicken Rice", category: "Cleanliness", description: "The collection counter needed wiping.", status: "resolved", complaintDate: createMonthDate(0, 18) },
  { complaintId: 5, customerName: "vanessalee", stallName: "Ben's Chicken Rice", category: "Others", description: "The takeaway bag was missing cutlery.", status: "pending", complaintDate: createMonthDate(1, 10) },
  { complaintId: 6, customerName: "wendyneo", stallName: "Ben's Chicken Rice", category: "Food Quality", description: "The rice was too dry.", status: "resolved", complaintDate: createMonthDate(2, 12) },
  { complaintId: 7, customerName: "xavierlim", stallName: "Ben's Chicken Rice", category: "Service Quality", description: "The order instructions were not followed.", status: "in progress", complaintDate: createMonthDate(3, 7) },
  { complaintId: 8, customerName: "yasminibrahim", stallName: "Ben's Chicken Rice", category: "Waiting Time", description: "Evening collection was delayed.", status: "resolved", complaintDate: createMonthDate(4, 20) },
  { complaintId: 9, customerName: "zacharytan", stallName: "Ben's Chicken Rice", category: "Cleanliness", description: "The tray return area was untidy.", status: "resolved", complaintDate: createMonthDate(5, 5) },
  { complaintId: 10, customerName: "aidankoh", stallName: "Ben's Chicken Rice", category: "Food Quality", description: "The soup tasted too salty.", status: "pending", complaintDate: createMonthDate(7, 14) },
  { complaintId: 11, customerName: "brendachong", stallName: "Ben's Chicken Rice", category: "Service Quality", description: "Staff could explain sold-out items more clearly.", status: "resolved", complaintDate: createMonthDate(10, 9) },
];

let ratingTrendChart = null;
let currentDateRange = null;
let mockMode = false;

// =========================================================
// STEP 1: Date and display helpers
// =========================================================
function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateValue) {
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);
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

function showMessage(message, isError = false) {
  const messageElement = document.getElementById("satisfactionMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function showFilterMessage(message, isError = false) {
  const messageElement = document.getElementById("filterMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function setFiltersLoading(isLoading) {
  document.querySelectorAll(".range-button").forEach((button) => {
    button.disabled = isLoading;
  });
  document.getElementById("complaintCategory").disabled = isLoading;
}

function updatePeriodLabels(dateRange, category) {
  document.getElementById("periodLabel").textContent = dateRange.label;

  const isWeekly = dateRange.granularity === "week";
  const chart = document.getElementById("ratingTrendChart");

  document.getElementById("ratingTrendSubtitle").textContent = isWeekly
    ? "Customer rating by week"
    : "Customer rating by month";

  chart.setAttribute(
    "aria-label",
    isWeekly
      ? "Weekly average customer rating line chart"
      : "Monthly average customer rating line chart"
  );

  const categoryText = category ? ` Complaint category: ${category}.` : "";
  showFilterMessage(
    `Showing ${formatDisplayDate(dateRange.startDate)} to ${formatDisplayDate(
      dateRange.endDate
    )}.${categoryText}`
  );
}

// =========================================================
// STEP 2: Build mock results from one consistent dataset
// =========================================================
function buildMockRatingTrend(feedbackRows, dateRange) {
  const groups = new Map();

  feedbackRows.forEach((feedback) => {
    const feedbackDate = new Date(`${feedback.feedbackDate}T00:00:00Z`);
    let groupKey;
    let periodStart;
    let periodLabel;

    if (dateRange.granularity === "week") {
      const startDate = new Date(`${dateRange.startDate}T00:00:00Z`);
      const weekNumber = Math.floor((feedbackDate - startDate) / 604800000);
      const weekStart = new Date(startDate);
      weekStart.setUTCDate(weekStart.getUTCDate() + weekNumber * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

      const finalDate = new Date(`${dateRange.endDate}T00:00:00Z`);
      if (weekEnd > finalDate) {
        weekEnd.setTime(finalDate.getTime());
      }

      groupKey = weekStart.toISOString().slice(0, 10);
      periodStart = groupKey;
      periodLabel = `${weekStart.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })} - ${weekEnd.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })}`;
    } else {
      groupKey = feedback.feedbackDate.slice(0, 7);
      periodStart = `${groupKey}-01`;
      periodLabel = feedbackDate.toLocaleDateString("en-SG", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        periodStart: periodStart,
        periodLabel: periodLabel,
        ratingTotal: 0,
        feedbackCount: 0,
      });
    }

    const group = groups.get(groupKey);
    group.ratingTotal += feedback.rating;
    group.feedbackCount += 1;
  });

  return Array.from(groups.values())
    .map((group) => {
      return {
        periodStart: group.periodStart,
        periodLabel: group.periodLabel,
        feedbackCount: group.feedbackCount,
        averageRating: group.ratingTotal / group.feedbackCount,
      };
    })
    .sort((first, second) => first.periodStart.localeCompare(second.periodStart));
}

function buildMockDashboard(dateRange, category) {
  const feedbackRows = MOCK_FEEDBACK.filter((feedback) => {
    return (
      feedback.feedbackDate >= dateRange.startDate &&
      feedback.feedbackDate <= dateRange.endDate
    );
  });

  const complaintRows = MOCK_COMPLAINTS.filter((complaint) => {
    const matchesDate =
      complaint.complaintDate >= dateRange.startDate &&
      complaint.complaintDate <= dateRange.endDate;
    const matchesCategory = !category || complaint.category === category;
    return matchesDate && matchesCategory;
  });

  let ratingTotal = 0;
  feedbackRows.forEach((feedback) => {
    ratingTotal += feedback.rating;
  });

  const categoryCounts = new Map();
  complaintRows.forEach((complaint) => {
    const currentCount = categoryCounts.get(complaint.category) || 0;
    categoryCounts.set(complaint.category, currentCount + 1);
  });

  const complaintCategories = Array.from(categoryCounts.entries())
    .map(([categoryName, complaintCount]) => {
      return {
        category: categoryName,
        complaintCount: complaintCount,
      };
    })
    .sort((first, second) => {
      if (second.complaintCount !== first.complaintCount) {
        return second.complaintCount - first.complaintCount;
      }
      return first.category.localeCompare(second.category);
    });

  const openComplaints = complaintRows.filter((complaint) => {
    return complaint.status === "pending" || complaint.status === "in progress";
  }).length;

  return {
    stalls: [{ stallId: "STALL001", stallName: "Ben's Chicken Rice" }],
    summary: {
      totalFeedback: feedbackRows.length,
      averageRating:
        feedbackRows.length > 0 ? ratingTotal / feedbackRows.length : 0,
      totalComplaints: complaintRows.length,
      openComplaints: openComplaints,
    },
    ratingTrend: buildMockRatingTrend(feedbackRows, dateRange),
    complaintCategories: complaintCategories,
    recentFeedback: [...feedbackRows]
      .sort((first, second) => second.feedbackDate.localeCompare(first.feedbackDate))
      .slice(0, 5),
    recentComplaints: [...complaintRows]
      .sort((first, second) => second.complaintDate.localeCompare(first.complaintDate))
      .slice(0, 10),
  };
}

// =========================================================
// STEP 3: Fill the summary cards
// =========================================================
function displaySummary(data) {
  const stallNames = data.stalls.map((stall) => stall.stallName);
  const averageRating = Number(data.summary.averageRating || 0);

  document.getElementById("stallNameBadge").textContent = stallNames.join(", ");
  document.getElementById("averageRating").textContent = averageRating.toFixed(1);
  document.getElementById("totalFeedback").textContent = Number(
    data.summary.totalFeedback || 0
  ).toLocaleString();
  document.getElementById("totalComplaints").textContent = Number(
    data.summary.totalComplaints || 0
  ).toLocaleString();
  document.getElementById("openComplaints").textContent = Number(
    data.summary.openComplaints || 0
  ).toLocaleString();
}

// =========================================================
// STEP 4: Draw the rating line chart
// =========================================================
function displayRatingTrend(ratingTrend) {
  if (ratingTrendChart) {
    ratingTrendChart.destroy();
    ratingTrendChart = null;
  }

  const canvas = document.getElementById("ratingTrendChart");
  const emptyMessage = document.getElementById("ratingTrendEmpty");
  const hasData = ratingTrend.length > 0;

  canvas.hidden = !hasData;
  emptyMessage.hidden = hasData;

  if (!hasData) {
    return true;
  }

  if (typeof Chart === "undefined") {
    canvas.hidden = true;
    emptyMessage.hidden = false;
    emptyMessage.textContent = "The chart library could not be loaded.";
    return false;
  }

  Chart.defaults.font.family = '"DM Sans", Arial, sans-serif';
  Chart.defaults.color = "#686861";

  ratingTrendChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: ratingTrend.map((period) => period.periodLabel),
      datasets: [
        {
          label: "Average rating",
          data: ratingTrend.map((period) => Number(period.averageRating)),
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
              return ` Average rating: ${Number(context.parsed.y).toFixed(1)} / 5`;
            },
            afterLabel: function (context) {
              const row = ratingTrend[context.dataIndex];
              return ` Feedback received: ${row.feedbackCount}`;
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
            maxTicksLimit: window.matchMedia("(max-width: 600px)").matches ? 4 : 7,
          },
        },
        y: {
          min: 1,
          max: 5,
          grid: { color: "#eceee7" },
          border: { display: false },
          ticks: {
            stepSize: 1,
            callback: function (value) {
              return `${value}`;
            },
          },
        },
      },
    },
  });

  return true;
}

// =========================================================
// STEP 5: Show complaint category counts
// =========================================================
function displayComplaintCategories(categories) {
  const categoryList = document.getElementById("complaintCategoryList");
  categoryList.innerHTML = "";

  if (categories.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "panel-empty";
    emptyMessage.textContent = "No complaints were found for these filters.";
    categoryList.appendChild(emptyMessage);
    return;
  }

  const maximumCount = Math.max(
    ...categories.map((category) => Number(category.complaintCount || 0)),
    1
  );

  categories.forEach((category) => {
    const complaintCount = Number(category.complaintCount || 0);
    const row = document.createElement("div");
    row.className = "category-row";

    const heading = document.createElement("div");
    heading.className = "category-row-heading";

    const name = document.createElement("span");
    name.textContent = category.category;

    const count = document.createElement("span");
    count.className = "category-count";
    count.textContent = complaintCount;

    const track = document.createElement("div");
    track.className = "category-bar-track";
    track.setAttribute("aria-hidden", "true");

    const fill = document.createElement("div");
    fill.className = "category-bar-fill";
    fill.style.width = `${(complaintCount / maximumCount) * 100}%`;

    heading.appendChild(name);
    heading.appendChild(count);
    track.appendChild(fill);
    row.appendChild(heading);
    row.appendChild(track);
    categoryList.appendChild(row);
  });
}

// =========================================================
// STEP 6: Show recent written feedback
// =========================================================
function displayRecentFeedback(feedbackRows) {
  const feedbackList = document.getElementById("recentFeedbackList");
  feedbackList.innerHTML = "";

  if (feedbackRows.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "panel-empty";
    emptyMessage.textContent = "No written feedback was found for this period.";
    feedbackList.appendChild(emptyMessage);
    return;
  }

  feedbackRows.forEach((feedback) => {
    const item = document.createElement("article");
    item.className = "feedback-item";

    const heading = document.createElement("div");
    heading.className = "feedback-item-heading";

    const customer = document.createElement("p");
    customer.className = "feedback-customer";
    customer.textContent = feedback.customerName;

    const rating = document.createElement("p");
    rating.className = "feedback-rating";
    rating.textContent = `${Number(feedback.rating).toFixed(0)} / 5`;

    const comment = document.createElement("p");
    comment.className = "feedback-comment";
    comment.textContent = feedback.comments;

    const meta = document.createElement("p");
    meta.className = "feedback-meta";
    meta.textContent = `${feedback.stallName} | ${formatDisplayDate(
      feedback.feedbackDate
    )}`;

    heading.appendChild(customer);
    heading.appendChild(rating);
    item.appendChild(heading);
    item.appendChild(comment);
    item.appendChild(meta);
    feedbackList.appendChild(item);
  });
}

// =========================================================
// STEP 7: Show recent complaints in the table
// =========================================================
function formatStatus(status) {
  if (status === "in progress") {
    return "In Progress";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function displayRecentComplaints(complaints) {
  const tableBody = document.getElementById("recentComplaintsBody");
  tableBody.innerHTML = "";

  if (complaints.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "table-empty";
    cell.textContent = "No complaints were found for these filters.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  complaints.forEach((complaint) => {
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.className = "complaint-date";
    dateCell.textContent = formatDisplayDate(complaint.complaintDate);

    const customerCell = document.createElement("td");
    customerCell.className = "complaint-customer";
    customerCell.textContent = complaint.customerName;

    const stallCell = document.createElement("td");
    stallCell.textContent = complaint.stallName;

    const categoryCell = document.createElement("td");
    categoryCell.className = "complaint-category";
    categoryCell.textContent = complaint.category;

    const descriptionCell = document.createElement("td");
    descriptionCell.className = "complaint-description";
    descriptionCell.textContent = complaint.description;

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge ${complaint.status.replace(" ", "-")}`;
    statusBadge.textContent = formatStatus(complaint.status);
    statusCell.appendChild(statusBadge);

    row.appendChild(dateCell);
    row.appendChild(customerCell);
    row.appendChild(stallCell);
    row.appendChild(categoryCell);
    row.appendChild(descriptionCell);
    row.appendChild(statusCell);
    tableBody.appendChild(row);
  });
}

function displayDashboard(data, dateRange, category) {
  displaySummary(data);
  const chartLoaded = displayRatingTrend(data.ratingTrend);
  displayComplaintCategories(data.complaintCategories);
  displayRecentFeedback(data.recentFeedback);
  displayRecentComplaints(data.recentComplaints);
  updatePeriodLabels(dateRange, category);
  return chartLoaded;
}

// =========================================================
// STEP 8: Request the logged-in vendor's SQL dashboard data
// =========================================================
async function loadSatisfaction(dateRange) {
  currentDateRange = dateRange;
  const category = document.getElementById("complaintCategory").value;
  const query = new URLSearchParams(window.location.search);
  const mockPreference = query.get("mock");
  const isLiveServerPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  mockMode = mockPreference === "true" || (mockPreference !== "false" && isLiveServerPreview);

  setFiltersLoading(true);
  showMessage("Loading customer satisfaction data...");

  if (mockMode) {
    const data = buildMockDashboard(dateRange, category);
    const chartLoaded = displayDashboard(data, dateRange, category);

    if (chartLoaded) {
      showMessage("Mock preview data. Connect MSSQL for the live dashboard.");
    }

    setFiltersLoading(false);
    return;
  }

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "vendor") {
    showMessage("Please log in with a vendor account to view this dashboard.", true);
    setFiltersLoading(false);
    return;
  }

  try {
    const requestUrl = new URL(API_URL);
    requestUrl.searchParams.set("startDate", dateRange.startDate);
    requestUrl.searchParams.set("endDate", dateRange.endDate);

    if (category) {
      requestUrl.searchParams.set("category", category);
    }

    const response = await fetch(requestUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load customer satisfaction data");
    }

    const chartLoaded = displayDashboard(data, dateRange, category);

    if (chartLoaded) {
      showMessage("Customer satisfaction data loaded from MSSQL.");
    }
  } catch (error) {
    console.error("Customer satisfaction dashboard error:", error);
    showMessage(error.message, true);
    showFilterMessage("The selected results could not be loaded.", true);
  } finally {
    setFiltersLoading(false);
  }
}

function selectDateRange(event) {
  const selectedButton = event.currentTarget;
  const monthCount = Number(selectedButton.dataset.months);

  document.querySelectorAll(".range-button").forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  loadSatisfaction(getPresetDateRange(monthCount));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".range-button").forEach((button) => {
    button.addEventListener("click", selectDateRange);
  });

  document
    .getElementById("complaintCategory")
    .addEventListener("change", () => {
      loadSatisfaction(currentDateRange || getPresetDateRange(6));
    });

  loadSatisfaction(getPresetDateRange(6));
});
