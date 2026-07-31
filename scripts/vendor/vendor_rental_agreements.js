const API_URL = "http://localhost:3000/vendor-rental-agreements";

// =========================================================
// MOCK PREVIEW DATA
// Used only when the page URL includes ?mock=true.
// Every rental field and history field has a sample value.
// =========================================================
function createRelativeDate(daysFromToday) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

const MOCK_VENDOR_SCENARIOS = {
  renewalDue: {
    vendorUsername: "bensvendor",
    stalls: [
      { stallId: "STALL001", stallName: "Ben's Chicken Rice" },
    ],
    agreements: [
      {
        agreementId: "RA001",
        stallId: "STALL001",
        stallName: "Ben's Chicken Rice",
        agreementReference: "HCR-STALL001-CURRENT",
        startDate: createRelativeDate(-304),
        endDate: createRelativeDate(61),
        monthlyRent: 1850,
        renewalDate: createRelativeDate(21),
        status: "renewal due",
        termsSummary: "Monthly rent includes common-area cleaning and waste collection. Utilities are billed separately.",
        updatedAt: createRelativeDate(-12),
      },
      {
        agreementId: "RA002",
        stallId: "STALL001",
        stallName: "Ben's Chicken Rice",
        agreementReference: "HCR-STALL001-PREVIOUS",
        startDate: createRelativeDate(-669),
        endDate: createRelativeDate(-304),
        monthlyRent: 1720,
        renewalDate: createRelativeDate(-334),
        status: "renewed",
        termsSummary: "Previous twelve-month rental term for the same stall.",
        updatedAt: createRelativeDate(-304),
      },
    ],
    changes: [
      {
        changeId: 1,
        agreementId: "RA001",
        fieldChanged: "Monthly rent",
        previousValue: "S$1,800.00",
        newValue: "S$1,850.00",
        changeReason: "Annual rental rate adjustment",
        changedAt: createRelativeDate(-12),
        changedByName: "bensvendor",
      },
      {
        changeId: 2,
        agreementId: "RA001",
        fieldChanged: "Renewal date",
        previousValue: "30 days before expiry",
        newValue: "21 days from today",
        changeReason: "Updated after landlord confirmation",
        changedAt: createRelativeDate(-12),
        changedByName: "bensvendor",
      },
      {
        changeId: 3,
        agreementId: "RA001",
        fieldChanged: "Terms summary",
        previousValue: "Cleaning included",
        newValue: "Cleaning and waste collection included",
        changeReason: "Clarified included services",
        changedAt: createRelativeDate(-20),
        changedByName: "bensvendor",
      },
      {
        changeId: 4,
        agreementId: "RA002",
        fieldChanged: "Status",
        previousValue: "active",
        newValue: "renewed",
        changeReason: "Renewal completed for the next term",
        changedAt: createRelativeDate(-304),
        changedByName: "bensvendor",
      },
    ],
  },
  active: {
    vendorUsername: "limvendor",
    stalls: [
      { stallId: "STALL002", stallName: "Lim Ah Cheng Stall" },
    ],
    agreements: [
      {
        agreementId: "RA003",
        stallId: "STALL002",
        stallName: "Lim Ah Cheng Stall",
        agreementReference: "HCR-STALL002-CURRENT",
        startDate: createRelativeDate(-120),
        endDate: createRelativeDate(245),
        monthlyRent: 1630,
        renewalDate: createRelativeDate(210),
        status: "active",
        termsSummary: "The stall may operate daily from 7am to 9pm. Cleaning fees are included and utilities are billed monthly.",
        updatedAt: createRelativeDate(-35),
      },
    ],
    changes: [
      {
        changeId: 5,
        agreementId: "RA003",
        fieldChanged: "Monthly rent",
        previousValue: "S$1,580.00",
        newValue: "S$1,630.00",
        changeReason: "Updated maintenance contribution",
        changedAt: createRelativeDate(-35),
        changedByName: "limvendor",
      },
      {
        changeId: 6,
        agreementId: "RA003",
        fieldChanged: "Terms summary",
        previousValue: "Daily operating hours apply",
        newValue: "Daily operating hours and utility billing clarified",
        changeReason: "Added the confirmed operating conditions",
        changedAt: createRelativeDate(-35),
        changedByName: "limvendor",
      },
      {
        changeId: 7,
        agreementId: "RA003",
        fieldChanged: "Renewal date",
        previousValue: "180 days from today",
        newValue: "210 days from today",
        changeReason: "Aligned with the signed agreement schedule",
        changedAt: createRelativeDate(-60),
        changedByName: "limvendor",
      },
    ],
  },
  empty: {
    vendorUsername: "teohvendor",
    stalls: [
      { stallId: "STALL003", stallName: "Teoh Brothers Noodle" },
    ],
    agreements: [],
    changes: [],
  },
};

let rentalData = null;
let selectedAgreementId = null;
let mockMode = false;
let currentMockScenario = "renewalDue";

function cloneMockScenario(scenarioKey) {
  return JSON.parse(JSON.stringify(MOCK_VENDOR_SCENARIOS[scenarioKey]));
}

// =========================================================
// STEP 1: Small display helpers
// =========================================================
function dateOnly(dateValue) {
  return String(dateValue || "").slice(0, 10);
}

function formatDate(dateValue) {
  const value = dateOnly(dateValue);

  if (!value) {
    return "Not recorded";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Not recorded";
  }

  const value = new Date(dateValue);

  if (Number.isNaN(value.getTime())) {
    return formatDate(dateValue);
  }

  return value.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return `S$${Number(value || 0).toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getDaysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateOnly(dateValue)}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function getStatusClass(status) {
  return `status-${String(status || "").toLowerCase().replaceAll(" ", "-")}`;
}

function showPageMessage(message, isError = false) {
  const messageElement = document.getElementById("pageMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function showFormMessage(message, isError = false) {
  const messageElement = document.getElementById("formMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", isError);
}

function getSelectedAgreement() {
  return rentalData.agreements.find((agreement) => {
    return agreement.agreementId === selectedAgreementId;
  });
}

// =========================================================
// STEP 2: Summary cards and renewal reminder
// =========================================================
function displaySummary() {
  const currentAgreements = rentalData.agreements.filter((agreement) => {
    return agreement.status === "active" || agreement.status === "renewal due";
  });

  const nextAgreement = [...currentAgreements].sort((first, second) => {
    return dateOnly(first.renewalDate).localeCompare(dateOnly(second.renewalDate));
  })[0];

  const totalMonthlyRent = currentAgreements.reduce((total, agreement) => {
    return total + Number(agreement.monthlyRent || 0);
  }, 0);

  document.getElementById("currentAgreementCount").textContent = currentAgreements.length;
  document.getElementById("nextRenewalDate").textContent = nextAgreement
    ? formatDate(nextAgreement.renewalDate)
    : "Not scheduled";
  document.getElementById("currentMonthlyRent").textContent = formatCurrency(totalMonthlyRent);
  document.getElementById("changeCount").textContent = rentalData.changes.length;

  displayRenewalAlert(nextAgreement);
}

function displayRenewalAlert(agreement) {
  const alert = document.getElementById("renewalAlert");

  if (!agreement) {
    alert.hidden = true;
    return;
  }

  const daysUntilRenewal = getDaysUntil(agreement.renewalDate);

  if (daysUntilRenewal > 60) {
    alert.hidden = true;
    return;
  }

  alert.hidden = false;
  alert.classList.toggle("overdue", daysUntilRenewal < 0);

  const title = document.getElementById("renewalAlertTitle");
  const text = document.getElementById("renewalAlertText");

  if (daysUntilRenewal < 0) {
    title.textContent = "Renewal date has passed";
    text.textContent = `${agreement.stallName} was due for renewal ${Math.abs(daysUntilRenewal)} days ago.`;
  } else if (daysUntilRenewal === 0) {
    title.textContent = "Renewal is due today";
    text.textContent = `${agreement.stallName} requires renewal attention today.`;
  } else {
    title.textContent = "Upcoming rental renewal";
    text.textContent = `${agreement.stallName} is due for renewal in ${daysUntilRenewal} days, on ${formatDate(agreement.renewalDate)}.`;
  }

  document.getElementById("reviewRenewalButton").dataset.agreementId = agreement.agreementId;
}

// =========================================================
// STEP 3: Agreement list and selected agreement details
// =========================================================
function displayAgreementList() {
  const list = document.getElementById("agreementList");
  const empty = document.getElementById("agreementEmpty");
  list.innerHTML = "";

  if (rentalData.agreements.length === 0) {
    empty.hidden = false;
    document.getElementById("agreementDetail").hidden = true;
    document.getElementById("historyPanel").hidden = true;
    return;
  }

  empty.hidden = true;

  rentalData.agreements.forEach((agreement) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "agreement-list-item";
    button.classList.toggle("active", agreement.agreementId === selectedAgreementId);
    button.dataset.agreementId = agreement.agreementId;

    const topRow = document.createElement("span");
    topRow.className = "list-item-top";

    const stallName = document.createElement("span");
    stallName.className = "list-stall-name";
    stallName.textContent = agreement.stallName;

    const status = document.createElement("span");
    status.className = `list-status ${getStatusClass(agreement.status)}`;
    status.textContent = agreement.status;

    const reference = document.createElement("span");
    reference.className = "list-reference";
    reference.textContent = agreement.agreementReference;

    const renewal = document.createElement("span");
    renewal.className = "list-renewal";
    renewal.textContent = `Renewal: ${formatDate(agreement.renewalDate)}`;

    topRow.appendChild(stallName);
    topRow.appendChild(status);
    button.appendChild(topRow);
    button.appendChild(reference);
    button.appendChild(renewal);

    button.addEventListener("click", () => {
      selectAgreement(agreement.agreementId);
    });

    list.appendChild(button);
  });
}

function displayAgreementDetails() {
  const agreement = getSelectedAgreement();

  if (!agreement) {
    document.getElementById("agreementDetail").hidden = true;
    document.getElementById("historyPanel").hidden = true;
    return;
  }

  document.getElementById("agreementDetail").hidden = false;
  document.getElementById("historyPanel").hidden = false;
  document.getElementById("agreementReference").textContent = agreement.agreementReference;
  document.getElementById("agreementStallName").textContent = agreement.stallName;
  document.getElementById("rentalPeriod").textContent = `${formatDate(agreement.startDate)} to ${formatDate(agreement.endDate)}`;
  document.getElementById("monthlyRent").textContent = formatCurrency(agreement.monthlyRent);
  document.getElementById("renewalDate").textContent = formatDate(agreement.renewalDate);
  document.getElementById("updatedAt").textContent = formatDateTime(agreement.updatedAt);
  document.getElementById("termsSummary").textContent = agreement.termsSummary || "No terms summary was recorded.";

  const status = document.getElementById("agreementStatus");
  status.className = `status-badge ${getStatusClass(agreement.status)}`;
  status.textContent = agreement.status;

  displayChangeHistory();
}

function selectAgreement(agreementId) {
  selectedAgreementId = agreementId;
  displayAgreementList();
  displayAgreementDetails();
}

// =========================================================
// STEP 4: Change history table
// =========================================================
function displayChangeHistory() {
  const tableBody = document.getElementById("historyTableBody");
  const empty = document.getElementById("historyEmpty");
  const agreementChanges = rentalData.changes.filter((change) => {
    return change.agreementId === selectedAgreementId;
  });

  tableBody.innerHTML = "";

  if (agreementChanges.length === 0) {
    empty.hidden = false;
    document.querySelector(".history-table-wrap").hidden = true;
    return;
  }

  empty.hidden = true;
  document.querySelector(".history-table-wrap").hidden = false;

  agreementChanges.forEach((change) => {
    const row = document.createElement("tr");
    let changedBy = change.changedByName;

    if (change.changedByRole) {
      changedBy += ` (${change.changedByRole})`;
    }

    const values = [
      formatDateTime(change.changedAt),
      change.fieldChanged,
      change.previousValue || "Not recorded",
      change.newValue || "Not recorded",
      change.changeReason,
      changedBy,
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;

      if (index === 1) {
        cell.className = "history-field";
      }

      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });
}

// =========================================================
// STEP 5: Edit modal and authorized update
// =========================================================
function openAgreementModal() {
  const agreement = getSelectedAgreement();

  if (!agreement) {
    return;
  }

  document.getElementById("modalAgreementReference").textContent = agreement.agreementReference;
  document.getElementById("editStartDate").value = dateOnly(agreement.startDate);
  document.getElementById("editEndDate").value = dateOnly(agreement.endDate);
  document.getElementById("editMonthlyRent").value = Number(agreement.monthlyRent).toFixed(2);
  document.getElementById("editRenewalDate").value = dateOnly(agreement.renewalDate);
  document.getElementById("editStatus").value = agreement.status;
  document.getElementById("editTermsSummary").value = agreement.termsSummary || "";
  document.getElementById("editChangeReason").value = "";
  showFormMessage("");

  document.getElementById("agreementModal").hidden = false;
  document.getElementById("editStartDate").focus();
}

function closeAgreementModal() {
  document.getElementById("agreementModal").hidden = true;
}

function getFormData() {
  return {
    startDate: document.getElementById("editStartDate").value,
    endDate: document.getElementById("editEndDate").value,
    monthlyRent: Number(document.getElementById("editMonthlyRent").value),
    renewalDate: document.getElementById("editRenewalDate").value,
    status: document.getElementById("editStatus").value,
    termsSummary: document.getElementById("editTermsSummary").value.trim(),
    changeReason: document.getElementById("editChangeReason").value.trim(),
  };
}

function validateFormData(formData) {
  if (formData.startDate > formData.endDate) {
    return "The rental start date must be before the end date.";
  }

  if (formData.renewalDate < formData.startDate || formData.renewalDate > formData.endDate) {
    return "The renewal date must fall within the rental period.";
  }

  if (!Number.isFinite(formData.monthlyRent) || formData.monthlyRent < 0) {
    return "Monthly rent must be zero or more.";
  }

  if (formData.changeReason.length < 3) {
    return "Enter a short reason for the change.";
  }

  return "";
}

function saveMockAgreement(formData) {
  const agreement = getSelectedAgreement();
  const fields = [
    { property: "startDate", label: "Start date", format: formatDate },
    { property: "endDate", label: "End date", format: formatDate },
    { property: "monthlyRent", label: "Monthly rent", format: formatCurrency },
    { property: "renewalDate", label: "Renewal date", format: formatDate },
    { property: "status", label: "Status", format: String },
    { property: "termsSummary", label: "Terms summary", format: String },
  ];

  let changesAdded = 0;

  fields.forEach((field) => {
    const oldValue = agreement[field.property];
    const newValue = formData[field.property];

    if (String(oldValue) !== String(newValue)) {
      rentalData.changes.unshift({
        changeId: Date.now() + changesAdded,
        agreementId: agreement.agreementId,
        fieldChanged: field.label,
        previousValue: field.format(oldValue),
        newValue: field.format(newValue),
        changeReason: formData.changeReason,
        changedAt: new Date().toISOString(),
        changedByName: rentalData.vendorUsername || "demo vendor",
      });

      agreement[field.property] = newValue;
      changesAdded += 1;
    }
  });

  if (changesAdded > 0) {
    agreement.updatedAt = new Date().toISOString();
  }

  closeAgreementModal();
  displayDashboard();

  if (changesAdded === 0) {
    showPageMessage("No agreement values were changed.");
  } else {
    showPageMessage(`Mock agreement updated. ${changesAdded} change record(s) added.`);
  }
}

async function saveLiveAgreement(formData) {
  const token = localStorage.getItem("token");
  const saveButton = document.getElementById("saveAgreementButton");
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const response = await fetch(`${API_URL}/${selectedAgreementId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to update the rental agreement");
    }

    closeAgreementModal();
    await loadRentalAgreements();
    showPageMessage(`Agreement updated. ${result.changesAdded} change record(s) added.`);
  } catch (error) {
    console.error("Rental agreement update error:", error);
    showFormMessage(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save changes";
  }
}

async function handleAgreementSubmit(event) {
  event.preventDefault();
  const formData = getFormData();
  const validationError = validateFormData(formData);

  if (validationError) {
    showFormMessage(validationError, true);
    return;
  }

  if (mockMode) {
    saveMockAgreement(formData);
    return;
  }

  await saveLiveAgreement(formData);
}

// =========================================================
// STEP 6: Load mock data or the logged-in vendor's MSSQL data
// =========================================================
function displayDashboard() {
  const stallNames = rentalData.stalls.map((stall) => stall.stallName);
  document.getElementById("stallBadge").textContent = stallNames.join(", ") || "No stall found";

  const selectedStillExists = rentalData.agreements.some((agreement) => {
    return agreement.agreementId === selectedAgreementId;
  });

  if (!selectedStillExists) {
    selectedAgreementId = null;
  }

  if (!selectedAgreementId && rentalData.agreements.length > 0) {
    selectedAgreementId = rentalData.agreements[0].agreementId;
  }

  displaySummary();
  displayAgreementList();
  displayAgreementDetails();
}

async function loadRentalAgreements() {
  const query = new URLSearchParams(window.location.search);
  mockMode = query.get("mock") === "true";

  if (mockMode) {
    document.getElementById("mockDemoControls").hidden = false;
    document.getElementById("mockVendorScenario").value = currentMockScenario;
    rentalData = cloneMockScenario(currentMockScenario);
    selectedAgreementId = null;
    displayDashboard();
    showPageMessage("Showing a complete fictional rental agreement demo. Changes stay in this browser preview only.");
    return;
  }

  document.getElementById("mockDemoControls").hidden = true;

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "vendor") {
    showPageMessage("Please log in with a vendor account to view rental agreements.", true);
    document.getElementById("stallBadge").textContent = "Vendor login required";
    return;
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to load rental agreements");
    }

    rentalData = result;

    const selectedStillExists = rentalData.agreements.some((agreement) => {
      return agreement.agreementId === selectedAgreementId;
    });

    if (!selectedStillExists) {
      selectedAgreementId = null;
    }

    displayDashboard();
    showPageMessage("Rental agreements loaded from MSSQL.");
  } catch (error) {
    console.error("Rental agreement loading error:", error);
    showPageMessage(error.message, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("editAgreementButton").addEventListener("click", openAgreementModal);
  document.getElementById("closeAgreementModal").addEventListener("click", closeAgreementModal);
  document.getElementById("cancelAgreementEdit").addEventListener("click", closeAgreementModal);
  document.getElementById("agreementForm").addEventListener("submit", handleAgreementSubmit);

  document.getElementById("mockVendorScenario").addEventListener("change", (event) => {
    currentMockScenario = event.target.value;
    rentalData = cloneMockScenario(currentMockScenario);
    selectedAgreementId = null;
    displayDashboard();

    const stallName = rentalData.stalls[0]?.stallName || "empty vendor";
    showPageMessage(`Showing fictional ${stallName} demo data.`);
  });

  document.getElementById("resetMockDemo").addEventListener("click", () => {
    rentalData = cloneMockScenario(currentMockScenario);
    selectedAgreementId = null;
    closeAgreementModal();
    displayDashboard();
    showPageMessage("Mock scenario reset to its original fictional data.");
  });

  document.getElementById("reviewRenewalButton").addEventListener("click", (event) => {
    selectAgreement(event.currentTarget.dataset.agreementId);
    document.getElementById("agreementDetail").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("agreementModal").addEventListener("click", (event) => {
    if (event.target.id === "agreementModal") {
      closeAgreementModal();
    }
  });

  loadRentalAgreements();
});
