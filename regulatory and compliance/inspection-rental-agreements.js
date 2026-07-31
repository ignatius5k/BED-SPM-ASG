const API_URL = "http://localhost:3000/inspection-rental-agreements";
const LOGIN_REDIRECT = "regulatory and compliance/inspection-rental-agreements.html";

let rentalData = {
  stalls: [],
  agreements: [],
  changes: [],
};

let selectedAgreementId = "";
let editingAgreementId = "";

function showPageMessage(message, isError) {
  const messageElement = document.getElementById("pageMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", Boolean(isError));
}

function showFormMessage(message, isError) {
  const messageElement = document.getElementById("formMessage");
  messageElement.textContent = message;
  messageElement.classList.toggle("error", Boolean(isError));
}

function goToInspectorLogin() {
  const redirect = encodeURIComponent(LOGIN_REDIRECT);
  window.location.href = `../login.html?redirect=${redirect}`;
}

function isInspectorLoggedIn() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return Boolean(token) && role === "inspector";
}

async function apiRequest(url, options) {
  const requestOptions = options || {};
  const headers = requestOptions.headers || {};
  headers.Authorization = `Bearer ${localStorage.getItem("token")}`;

  if (requestOptions.body) {
    headers["Content-Type"] = "application/json";
  }

  requestOptions.headers = headers;

  let response;

  try {
    response = await fetch(url, requestOptions);
  } catch (error) {
    throw new Error("Unable to reach the server. Start the backend and try again.");
  }

  let result = {};

  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }

  if (response.status === 401) {
    goToInspectorLogin();
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(result.message || result.error || "The request could not be completed.");
  }

  return result;
}

function dateOnly(dateValue) {
  return String(dateValue || "").slice(0, 10);
}

function formatDate(dateValue) {
  const value = dateOnly(dateValue);

  if (!value) {
    return "Not recorded";
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Not recorded";
  }

  return new Date(dateValue).toLocaleString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
  }).format(Number(value || 0));
}

function getStatusClass(status) {
  return `status-${String(status || "").toLowerCase().replaceAll(" ", "-")}`;
}

function getAgreement(agreementId) {
  for (let index = 0; index < rentalData.agreements.length; index += 1) {
    if (rentalData.agreements[index].agreementId === agreementId) {
      return rentalData.agreements[index];
    }
  }

  return null;
}

function getStall(stallId) {
  for (let index = 0; index < rentalData.stalls.length; index += 1) {
    if (rentalData.stalls[index].stallId === stallId) {
      return rentalData.stalls[index];
    }
  }

  return null;
}

function displaySummary() {
  let currentCount = 0;
  let renewalDueCount = 0;

  for (let index = 0; index < rentalData.agreements.length; index += 1) {
    const status = rentalData.agreements[index].status;

    if (status === "active" || status === "renewal due") {
      currentCount += 1;
    }

    if (status === "renewal due") {
      renewalDueCount += 1;
    }
  }

  document.getElementById("stallCount").textContent = rentalData.stalls.length;
  document.getElementById("agreementCount").textContent = rentalData.agreements.length;
  document.getElementById("currentCount").textContent = currentCount;
  document.getElementById("renewalDueCount").textContent = renewalDueCount;
}

function populateStallOptions() {
  const select = document.getElementById("stallId");
  const currentValue = select.value;
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a stall";
  select.appendChild(placeholder);

  for (let index = 0; index < rentalData.stalls.length; index += 1) {
    const stall = rentalData.stalls[index];
    const option = document.createElement("option");
    option.value = stall.stallId;
    option.textContent = `${stall.stallName} — ${stall.vendorName}`;
    select.appendChild(option);
  }

  if (getStall(currentValue)) {
    select.value = currentValue;
  }

  displaySelectedVendor();
}

function displaySelectedVendor() {
  const stall = getStall(document.getElementById("stallId").value);
  const vendorElement = document.getElementById("selectedVendor");

  if (!stall) {
    vendorElement.textContent = "The assigned vendor will see this agreement.";
    return;
  }

  vendorElement.textContent = `Assigned vendor: ${stall.vendorName} (${stall.vendorId})`;
}

function agreementMatchesFilters(agreement) {
  const search = document.getElementById("recordSearch").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;

  if (status !== "all" && agreement.status !== status) {
    return false;
  }

  if (!search) {
    return true;
  }

  const searchableText = [
    agreement.agreementReference,
    agreement.stallName,
    agreement.vendorName,
    agreement.agreementId,
  ].join(" ").toLowerCase();

  return searchableText.includes(search);
}

function appendTextCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

function displayRecords() {
  const tableBody = document.getElementById("recordsTableBody");
  const tableWrap = document.getElementById("recordsTableWrap");
  const empty = document.getElementById("recordsEmpty");
  let visibleCount = 0;

  tableBody.innerHTML = "";

  for (let index = 0; index < rentalData.agreements.length; index += 1) {
    const agreement = rentalData.agreements[index];

    if (!agreementMatchesFilters(agreement)) {
      continue;
    }

    visibleCount += 1;
    const row = document.createElement("tr");
    row.classList.toggle("selected", agreement.agreementId === selectedAgreementId);

    appendTextCell(row, agreement.agreementReference);
    appendTextCell(row, agreement.stallName);
    appendTextCell(row, agreement.vendorName);
    appendTextCell(row, `${formatDate(agreement.startDate)} – ${formatDate(agreement.endDate)}`);
    appendTextCell(row, formatCurrency(agreement.monthlyRent));
    appendTextCell(row, formatDate(agreement.renewalDate));

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `table-status ${getStatusClass(agreement.status)}`;
    statusBadge.textContent = agreement.status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "table-action";
    viewButton.textContent = "View";
    viewButton.dataset.agreementId = agreement.agreementId;
    viewButton.addEventListener("click", handleViewAgreement);
    actionCell.appendChild(viewButton);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  }

  tableWrap.hidden = visibleCount === 0;
  empty.hidden = visibleCount !== 0;
}

function handleViewAgreement(event) {
  selectAgreement(event.currentTarget.dataset.agreementId);
  document.getElementById("agreementDetail").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function displayHistory() {
  const tableBody = document.getElementById("historyTableBody");
  const tableWrap = document.getElementById("historyTableWrap");
  const empty = document.getElementById("historyEmpty");
  let historyCount = 0;

  tableBody.innerHTML = "";

  for (let index = 0; index < rentalData.changes.length; index += 1) {
    const change = rentalData.changes[index];

    if (change.agreementId !== selectedAgreementId) {
      continue;
    }

    historyCount += 1;
    const row = document.createElement("tr");
    let changedBy = change.changedByName || "Unknown user";

    if (change.changedByRole) {
      changedBy += ` (${change.changedByRole})`;
    }

    appendTextCell(row, formatDateTime(change.changedAt));
    appendTextCell(row, change.fieldChanged);
    appendTextCell(row, change.previousValue || "Not recorded");
    appendTextCell(row, change.newValue || "Not recorded");
    appendTextCell(row, change.changeReason);
    appendTextCell(row, changedBy);
    tableBody.appendChild(row);
  }

  tableWrap.hidden = historyCount === 0;
  empty.hidden = historyCount !== 0;
}

function displayAgreementDetails() {
  const detail = document.getElementById("agreementDetail");
  const agreement = getAgreement(selectedAgreementId);

  if (!agreement) {
    detail.hidden = true;
    return;
  }

  detail.hidden = false;
  document.getElementById("detailReference").textContent = agreement.agreementReference;
  document.getElementById("detailStallVendor").textContent = `${agreement.stallName} — ${agreement.vendorName}`;
  document.getElementById("detailAgreementId").textContent = agreement.agreementId;
  document.getElementById("detailPeriod").textContent = `${formatDate(agreement.startDate)} to ${formatDate(agreement.endDate)}`;
  document.getElementById("detailRent").textContent = formatCurrency(agreement.monthlyRent);
  document.getElementById("detailRenewal").textContent = formatDate(agreement.renewalDate);
  document.getElementById("detailUpdated").textContent = formatDateTime(agreement.updatedAt);
  document.getElementById("detailTerms").textContent = agreement.termsSummary || "No terms summary was recorded.";

  const status = document.getElementById("detailStatus");
  status.className = `status-badge ${getStatusClass(agreement.status)}`;
  status.textContent = agreement.status;

  displayHistory();
}

function selectAgreement(agreementId) {
  selectedAgreementId = agreementId;
  displayRecords();
  displayAgreementDetails();
}

function resetAgreementForm() {
  editingAgreementId = "";
  document.getElementById("agreementForm").reset();
  document.getElementById("stallId").disabled = false;
  document.getElementById("agreementReference").disabled = false;
  document.getElementById("status").value = "active";
  document.getElementById("formModeLabel").textContent = "New record";
  document.getElementById("agreementFormTitle").textContent = "Create rental agreement";
  document.getElementById("agreementFormHelp").textContent = "Select a stall and record the official rental details.";
  document.getElementById("changeReasonLabel").textContent = "Reason for creating agreement";
  document.getElementById("saveAgreementButton").textContent = "Create agreement";
  document.getElementById("cancelEditButton").hidden = true;
  showFormMessage("", false);
  displaySelectedVendor();
}

function startEditingAgreement() {
  const agreement = getAgreement(selectedAgreementId);

  if (!agreement) {
    return;
  }

  editingAgreementId = agreement.agreementId;
  document.getElementById("stallId").value = agreement.stallId;
  document.getElementById("stallId").disabled = true;
  document.getElementById("agreementReference").value = agreement.agreementReference;
  document.getElementById("agreementReference").disabled = true;
  document.getElementById("startDate").value = dateOnly(agreement.startDate);
  document.getElementById("endDate").value = dateOnly(agreement.endDate);
  document.getElementById("monthlyRent").value = Number(agreement.monthlyRent).toFixed(2);
  document.getElementById("renewalDate").value = dateOnly(agreement.renewalDate);
  document.getElementById("status").value = agreement.status;
  document.getElementById("termsSummary").value = agreement.termsSummary || "";
  document.getElementById("changeReason").value = "";
  document.getElementById("formModeLabel").textContent = "Editing record";
  document.getElementById("agreementFormTitle").textContent = "Update rental agreement";
  document.getElementById("agreementFormHelp").textContent = "The stall and official reference cannot be changed after creation.";
  document.getElementById("changeReasonLabel").textContent = "Reason for changing agreement";
  document.getElementById("saveAgreementButton").textContent = "Save changes";
  document.getElementById("cancelEditButton").hidden = false;
  showFormMessage("", false);
  displaySelectedVendor();

  document.querySelector(".form-panel").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function getAgreementFormData() {
  return {
    stallId: document.getElementById("stallId").value,
    agreementReference: document.getElementById("agreementReference").value.trim(),
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    monthlyRent: Number(document.getElementById("monthlyRent").value),
    renewalDate: document.getElementById("renewalDate").value,
    status: document.getElementById("status").value,
    termsSummary: document.getElementById("termsSummary").value.trim(),
    changeReason: document.getElementById("changeReason").value.trim(),
  };
}

function validateAgreementForm(formData) {
  if (!editingAgreementId && !formData.stallId) {
    return "Select a stall.";
  }

  if (!editingAgreementId && !formData.agreementReference) {
    return "Enter an agreement reference.";
  }

  if (!formData.startDate || !formData.endDate || !formData.renewalDate) {
    return "Enter all three agreement dates.";
  }

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
    return "Enter a reason of at least three characters.";
  }

  return "";
}

async function handleAgreementSubmit(event) {
  event.preventDefault();

  const formData = getAgreementFormData();
  const validationError = validateAgreementForm(formData);

  if (validationError) {
    showFormMessage(validationError, true);
    return;
  }

  const saveButton = document.getElementById("saveAgreementButton");
  const wasEditing = Boolean(editingAgreementId);
  const requestUrl = wasEditing ? `${API_URL}/${editingAgreementId}` : API_URL;
  const method = wasEditing ? "PUT" : "POST";
  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    const result = await apiRequest(requestUrl, {
      method: method,
      body: JSON.stringify(formData),
    });

    const savedAgreementId = result.agreement.agreementId;
    resetAgreementForm();
    await loadRentalAgreements(savedAgreementId, false);

    if (wasEditing) {
      showPageMessage(`Agreement updated. ${result.changesAdded} change record(s) added.`, false);
    } else {
      showPageMessage(`Agreement ${result.agreement.agreementReference} created successfully.`, false);
    }
  } catch (error) {
    showFormMessage(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = editingAgreementId ? "Save changes" : "Create agreement";
  }
}

async function loadRentalAgreements(preferredAgreementId, announceLoaded) {
  showPageMessage("Loading rental agreements...", false);

  try {
    rentalData = await apiRequest(API_URL, { method: "GET" });
    populateStallOptions();
    displaySummary();

    if (preferredAgreementId && getAgreement(preferredAgreementId)) {
      selectedAgreementId = preferredAgreementId;
    } else if (!getAgreement(selectedAgreementId)) {
      selectedAgreementId = rentalData.agreements.length > 0
        ? rentalData.agreements[0].agreementId
        : "";
    }

    displayRecords();
    displayAgreementDetails();

    if (announceLoaded !== false) {
      showPageMessage("Rental agreements loaded from MSSQL.", false);
    }
  } catch (error) {
    showPageMessage(error.message, true);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  if (!isInspectorLoggedIn()) {
    goToInspectorLogin();
    return;
  }

  const username = localStorage.getItem("username") || "Inspector";
  document.getElementById("inspectorBadge").textContent = `${username} · Inspector`;

  document.getElementById("stallId").addEventListener("change", displaySelectedVendor);
  document.getElementById("recordSearch").addEventListener("input", displayRecords);
  document.getElementById("statusFilter").addEventListener("change", displayRecords);
  document.getElementById("agreementForm").addEventListener("submit", handleAgreementSubmit);
  document.getElementById("cancelEditButton").addEventListener("click", resetAgreementForm);
  document.getElementById("editAgreementButton").addEventListener("click", startEditingAgreement);
  document.getElementById("refreshButton").addEventListener("click", function () {
    loadRentalAgreements(selectedAgreementId, true);
  });

  loadRentalAgreements("", true);
});
