const INSPECTION_API_URL = "http://localhost:3000/vendor-inspection-history";

let selectedMonths = 12;
let selectedStallId = "";
let mockMode = false;

// =========================================================
// MOCK PREVIEW DATA
// Only used when the page URL contains ?mock=true.
// All cards, warnings, chart points, and table rows are calculated
// from these same records so every value tallies.
// =========================================================
function createRelativeDate(monthsAgo, daysEarlier) {
  const today = new Date();
  const safeDay = Math.min(today.getDate(), 24);
  const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, safeDay);
  date.setDate(date.getDate() - daysEarlier);
  return date.toISOString().slice(0, 10);
}

const MOCK_STALLS = [
  { stallId: "STALL001", stallName: "Ben's Chicken Rice" },
];

const MOCK_INSPECTIONS = [
  { inspectionId: 0, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(15, 5), cleanlinessScore: 71, foodHandlingScore: 73, remarks: "Older baseline inspection retained in the full history.", grade: "C", inspectorName: "neaofficer02" },
  { inspectionId: 1, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(11, 3), cleanlinessScore: 74, foodHandlingScore: 76, remarks: "General hygiene was satisfactory with follow-up items.", grade: "C", inspectorName: "neaofficer03" },
  { inspectionId: 2, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(10, 10), cleanlinessScore: 64, foodHandlingScore: 67, remarks: "Corrective cleaning and staff retraining were required.", grade: "C", inspectorName: "neaofficer04" },
  { inspectionId: 3, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(9, 6), cleanlinessScore: 52, foodHandlingScore: 55, remarks: "Failed inspection due to unsafe food temperatures and poor cleaning.", grade: "D", inspectorName: "carolteo" },
  { inspectionId: 4, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(8, 4), cleanlinessScore: 68, foodHandlingScore: 70, remarks: "Cold-storage labels needed clearer dates.", grade: "C", inspectorName: "neaofficer02" },
  { inspectionId: 5, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(7, 11), cleanlinessScore: 81, foodHandlingScore: 80, remarks: "Routine inspection passed with minor housekeeping notes.", grade: "B", inspectorName: "neaofficer03" },
  { inspectionId: 6, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(6, 7), cleanlinessScore: 70, foodHandlingScore: 74, remarks: "Improve separation between raw and cooked food preparation.", grade: "C", inspectorName: "neaofficer04" },
  { inspectionId: 7, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(5, 9), cleanlinessScore: 76, foodHandlingScore: 79, remarks: "Acceptable result after the previous corrective action.", grade: "B", inspectorName: "carolteo" },
  { inspectionId: 8, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(4, 5), cleanlinessScore: 58, foodHandlingScore: 72, remarks: "Grease was found near the cooking area and required immediate cleaning.", grade: "C", inspectorName: "neaofficer02" },
  { inspectionId: 9, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(3, 8), cleanlinessScore: 78, foodHandlingScore: 82, remarks: "Cleaning schedule was followed; storage layout can improve.", grade: "B", inspectorName: "neaofficer03" },
  { inspectionId: 10, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(2, 10), cleanlinessScore: 83, foodHandlingScore: 86, remarks: "Hand-washing and temperature records were complete.", grade: "B", inspectorName: "carolteo" },
  { inspectionId: 11, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(1, 12), cleanlinessScore: 88, foodHandlingScore: 90, remarks: "Good hygiene controls with minor labelling improvements noted.", grade: "A", inspectorName: "neaofficer02" },
  { inspectionId: 12, stallId: "STALL001", stallName: "Ben's Chicken Rice", inspectionDate: createRelativeDate(0, 12), cleanlinessScore: 92, foodHandlingScore: 94, remarks: "Work areas were clean and food was stored correctly.", grade: "A", inspectorName: "carolteo" },
];

// =========================================================
// STEP 1: Basic helpers
// =========================================================
function formatDisplayDate(dateValue) {
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateValue) {
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
  });
}

function getPeriodLabel(months) {
  if (months === 0) {
    return "All history";
  }
  return `Last ${months} months`;
}

function isMajorIssue(inspection) {
  return (
    inspection.grade === "D" ||
    Number(inspection.cleanlinessScore) < 60 ||
    Number(inspection.foodHandlingScore) < 60
  );
}

function showMessage(message, isError = false) {
  const messageElement = document.getElementById("inspectionMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function setFiltersLoading(isLoading) {
  document.querySelectorAll(".period-button").forEach((button) => {
    button.disabled = isLoading;
  });

  document.getElementById("stallFilter").disabled = isLoading;
}

// =========================================================
// STEP 2: Build the mock response from one consistent dataset
// =========================================================
function buildMockDashboard(months, stallId) {
  const finalStallId = stallId || MOCK_STALLS[0].stallId;
  let inspections = MOCK_INSPECTIONS.filter((inspection) => {
    return inspection.stallId === finalStallId;
  });

  if (months !== 0) {
    const today = new Date();
    const cutoffDate = new Date(
      today.getFullYear(),
      today.getMonth() - months,
      today.getDate()
    );

    inspections = inspections.filter((inspection) => {
      const inspectionDate = new Date(`${inspection.inspectionDate}T00:00:00`);
      return inspectionDate >= cutoffDate;
    });
  }

  return {
    stalls: MOCK_STALLS,
    selectedStallId: finalStallId,
    periodMonths: months,
    inspections: inspections,
  };
}

// =========================================================
// STEP 3: Populate the stall selector
// =========================================================
function displayStallOptions(stalls, currentStallId) {
  const select = document.getElementById("stallFilter");
  select.innerHTML = "";

  stalls.forEach((stall) => {
    const option = document.createElement("option");
    option.value = stall.stallId;
    option.textContent = stall.stallName;
    option.selected = stall.stallId === currentStallId;
    select.appendChild(option);
  });

  selectedStallId = currentStallId;

  const selectedStall = stalls.find((stall) => {
    return stall.stallId === currentStallId;
  });

  document.getElementById("stallNameBadge").textContent = selectedStall
    ? selectedStall.stallName
    : "Vendor stall";
}

// =========================================================
// STEP 4: Calculate and display summary values
// =========================================================
function displaySummary(inspections) {
  if (inspections.length === 0) {
    document.getElementById("latestGrade").textContent = "--";
    document.getElementById("latestInspectionDate").textContent = "No inspection in this period";
    document.getElementById("averageCleanliness").textContent = "--";
    document.getElementById("averageFoodHandling").textContent = "--";
    document.getElementById("totalInspections").textContent = "0";
    document.getElementById("majorIssueCount").textContent = "0";
    return;
  }

  const latestInspection = inspections[inspections.length - 1];
  let cleanlinessTotal = 0;
  let foodHandlingTotal = 0;

  inspections.forEach((inspection) => {
    cleanlinessTotal += Number(inspection.cleanlinessScore);
    foodHandlingTotal += Number(inspection.foodHandlingScore);
  });

  const majorIssues = inspections.filter(isMajorIssue);

  document.getElementById("latestGrade").textContent = latestInspection.grade;
  document.getElementById("latestInspectionDate").textContent = `Inspected ${formatDisplayDate(latestInspection.inspectionDate)}`;
  document.getElementById("averageCleanliness").textContent = (cleanlinessTotal / inspections.length).toFixed(1);
  document.getElementById("averageFoodHandling").textContent = (foodHandlingTotal / inspections.length).toFixed(1);
  document.getElementById("totalInspections").textContent = String(inspections.length);
  document.getElementById("majorIssueCount").textContent = String(majorIssues.length);
}

// =========================================================
// STEP 5: Highlight major hygiene issues
// =========================================================
function displayMajorIssues(inspections) {
  const issuePanel = document.getElementById("issuePanel");
  const issueSummary = document.getElementById("issueSummary");
  const issueList = document.getElementById("issueList");
  const majorIssues = inspections.filter(isMajorIssue).reverse();

  issueList.innerHTML = "";

  if (majorIssues.length === 0) {
    issuePanel.classList.add("clear");
    issueSummary.textContent = "No Grade D result or score below 60 was found in the selected period.";
    return;
  }

  issuePanel.classList.remove("clear");
  issueSummary.textContent = `${majorIssues.length} inspection${majorIssues.length === 1 ? "" : "s"} met the major-issue rule.`;

  majorIssues.forEach((inspection) => {
    const item = document.createElement("li");
    item.textContent = `${formatDisplayDate(inspection.inspectionDate)} — Grade ${inspection.grade}, cleanliness ${inspection.cleanlinessScore}, food handling ${inspection.foodHandlingScore}. ${inspection.remarks}`;
    issueList.appendChild(item);
  });
}

// =========================================================
// STEP 6: Draw a professional straight-line grade chart
// Grade A = 4, B = 3, C = 2, and D = 1.
// =========================================================
function displayGradeTrend(inspections) {
  const chart = document.getElementById("gradeTrendChart");
  const chartNote = document.getElementById("chartNote");

  if (inspections.length === 0) {
    chart.innerHTML = '<p class="panel-empty">No inspection grades were found for this period.</p>';
    chartNote.textContent = "Try a longer period to view older inspection results.";
    chart.setAttribute("aria-label", "No hygiene grade data for the selected period");
    return;
  }

  const gradeValues = { A: 4, B: 3, C: 2, D: 1 };
  const width = Math.max(760, inspections.length * 88);
  const height = 330;
  const left = 58;
  const right = 30;
  const top = 42;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const firstDate = new Date(`${inspections[0].inspectionDate}T00:00:00`).getTime();
  const lastDate = new Date(`${inspections[inspections.length - 1].inspectionDate}T00:00:00`).getTime();
  const dateRange = lastDate - firstDate;

  function getX(inspection, index) {
    if (inspections.length === 1 || dateRange === 0) {
      return left + plotWidth / 2;
    }

    const time = new Date(`${inspection.inspectionDate}T00:00:00`).getTime();
    return left + ((time - firstDate) / dateRange) * plotWidth;
  }

  function getY(grade) {
    const gradeValue = gradeValues[grade] || 1;
    return top + ((4 - gradeValue) / 3) * plotHeight;
  }

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">`;

  ["A", "B", "C", "D"].forEach((grade) => {
    const y = getY(grade);
    svg += `<line class="chart-grid-line" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"></line>`;
    svg += `<text class="chart-axis-text" x="${left - 22}" y="${y + 4}">${grade}</text>`;
  });

  const points = inspections.map((inspection, index) => {
    return `${getX(inspection, index)},${getY(inspection.grade)}`;
  });

  if (points.length > 1) {
    svg += `<polyline class="chart-grade-line" points="${points.join(" ")}"></polyline>`;
  }

  const labelStep = Math.max(1, Math.ceil(inspections.length / 6));

  inspections.forEach((inspection, index) => {
    const x = getX(inspection, index);
    const y = getY(inspection.grade);
    const issueClass = isMajorIssue(inspection) ? " issue" : "";
    svg += `<circle class="chart-point${issueClass}" cx="${x}" cy="${y}" r="6"></circle>`;
    svg += `<text class="chart-grade-text" x="${x}" y="${y - 13}" text-anchor="middle">${inspection.grade}</text>`;

    if (index % labelStep === 0 || index === inspections.length - 1) {
      svg += `<text class="chart-date-text" x="${x}" y="${height - 25}" text-anchor="middle">${formatShortDate(inspection.inspectionDate)}</text>`;
    }
  });

  svg += "</svg>";
  chart.innerHTML = svg;

  const gradeSequence = inspections.map((inspection) => {
    return inspection.grade;
  }).join(", ");
  chart.setAttribute(
    "aria-label",
    `Hygiene grade trend with ${inspections.length} inspections. Grades from oldest to newest: ${gradeSequence}.`
  );

  chartNote.textContent = inspections.length === 1
    ? "Only one inspection exists in this period, so a marker is shown without a connecting line."
    : `${inspections.length} official grades are connected using straight segments. Filled markers identify major issues.`;
}

// =========================================================
// STEP 7: Display exact inspection records in the table
// =========================================================
function displayInspectionTable(inspections) {
  const tableBody = document.getElementById("inspectionHistoryBody");
  const tableSummary = document.getElementById("tableSummary");
  tableBody.innerHTML = "";
  tableSummary.textContent = `${inspections.length} record${inspections.length === 1 ? "" : "s"}`;

  if (inspections.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "table-empty";
    cell.textContent = "No inspection records were found for this period.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  [...inspections].reverse().forEach((inspection) => {
    const issue = isMajorIssue(inspection);
    const row = document.createElement("tr");
    row.classList.toggle("issue-row", issue);

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDisplayDate(inspection.inspectionDate);

    const gradeCell = document.createElement("td");
    const gradeBadge = document.createElement("span");
    gradeBadge.className = `grade-badge grade-${inspection.grade.toLowerCase()}`;
    gradeBadge.textContent = inspection.grade;
    gradeCell.appendChild(gradeBadge);

    const cleanlinessCell = document.createElement("td");
    cleanlinessCell.className = "score-value";
    cleanlinessCell.textContent = `${inspection.cleanlinessScore} / 100`;

    const foodHandlingCell = document.createElement("td");
    foodHandlingCell.className = "score-value";
    foodHandlingCell.textContent = `${inspection.foodHandlingScore} / 100`;

    const inspectorCell = document.createElement("td");
    inspectorCell.textContent = inspection.inspectorName;

    const remarksCell = document.createElement("td");
    remarksCell.textContent = inspection.remarks || "No remarks recorded.";

    const resultCell = document.createElement("td");
    const resultBadge = document.createElement("span");
    resultBadge.className = issue ? "result-badge result-issue" : "result-badge result-pass";
    resultBadge.textContent = issue ? "Major issue" : "Pass";
    resultCell.appendChild(resultBadge);

    row.appendChild(dateCell);
    row.appendChild(gradeCell);
    row.appendChild(cleanlinessCell);
    row.appendChild(foodHandlingCell);
    row.appendChild(inspectorCell);
    row.appendChild(remarksCell);
    row.appendChild(resultCell);
    tableBody.appendChild(row);
  });
}

function displayDashboard(data) {
  const inspections = [...data.inspections].sort((first, second) => {
    return first.inspectionDate.localeCompare(second.inspectionDate);
  });

  selectedStallId = data.selectedStallId;
  displayStallOptions(data.stalls, data.selectedStallId);
  displaySummary(inspections);
  displayMajorIssues(inspections);
  displayGradeTrend(inspections);
  displayInspectionTable(inspections);
  document.getElementById("periodLabel").textContent = getPeriodLabel(selectedMonths);
}

// =========================================================
// STEP 8: Request the logged-in vendor's SQL inspection data
// =========================================================
async function loadInspectionHistory() {
  setFiltersLoading(true);
  showMessage("Loading inspection records...");

  if (mockMode) {
    const data = buildMockDashboard(selectedMonths, selectedStallId);
    displayDashboard(data);
    showMessage("Mock preview data. Connect MSSQL for the live inspection history.");
    setFiltersLoading(false);
    return;
  }

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "vendor") {
    showMessage("Please log in with a vendor account to view inspection history.", true);
    setFiltersLoading(false);
    return;
  }

  try {
    const requestUrl = new URL(INSPECTION_API_URL);
    requestUrl.searchParams.set("months", String(selectedMonths));

    if (selectedStallId) {
      requestUrl.searchParams.set("stallId", selectedStallId);
    }

    const response = await fetch(requestUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load inspection history");
    }

    displayDashboard(data);
    showMessage("Inspection records loaded from MSSQL.");
  } catch (error) {
    console.error("Inspection history error:", error);
    showMessage(error.message, true);
  } finally {
    setFiltersLoading(false);
  }
}

function selectPeriod(event) {
  const selectedButton = event.currentTarget;
  selectedMonths = Number(selectedButton.dataset.months);

  document.querySelectorAll(".period-button").forEach((button) => {
    const isSelected = button === selectedButton;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  loadInspectionHistory();
}

document.addEventListener("DOMContentLoaded", () => {
  const query = new URLSearchParams(window.location.search);
  mockMode = query.get("mock") === "true";

  document.querySelectorAll(".period-button").forEach((button) => {
    button.addEventListener("click", selectPeriod);
  });

  document.getElementById("stallFilter").addEventListener("change", (event) => {
    selectedStallId = event.target.value;
    loadInspectionHistory();
  });

  loadInspectionHistory();
});
