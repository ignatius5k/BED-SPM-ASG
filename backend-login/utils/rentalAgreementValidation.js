const VALID_STATUSES = ["active", "renewal due", "renewed", "expired"];
const CURRENT_STATUSES = ["active", "renewal due"];
const MAX_MONTHLY_RENT = 99999999.99;

function isValidAgreementId(agreementId) {
  return /^[A-Za-z0-9-]{1,10}$/.test(String(agreementId || "").trim());
}

function isValidStallId(stallId) {
  return /^[A-Za-z0-9-]{1,10}$/.test(String(stallId || "").trim());
}

function isValidDate(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return false;
  }

  const date = new Date(`${dateValue}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateValue
  );
}

function validateAgreementValues(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "The agreement request must be a JSON object" };
  }

  if (
    typeof body.startDate !== "string" ||
    typeof body.endDate !== "string" ||
    typeof body.renewalDate !== "string"
  ) {
    return { error: "Agreement dates must be text values in YYYY-MM-DD format" };
  }

  if (typeof body.status !== "string") {
    return { error: "The agreement status must be a text value" };
  }

  if (
    body.termsSummary !== undefined &&
    body.termsSummary !== null &&
    typeof body.termsSummary !== "string"
  ) {
    return { error: "The terms summary must be a text value" };
  }

  if (typeof body.changeReason !== "string") {
    return { error: "The change reason must be a text value" };
  }

  if (
    typeof body.monthlyRent !== "number" &&
    typeof body.monthlyRent !== "string"
  ) {
    return { error: "Monthly rent must be a number" };
  }

  const startDate = body.startDate.trim();
  const endDate = body.endDate.trim();
  const renewalDate = body.renewalDate.trim();
  const status = body.status.trim().toLowerCase();
  const termsSummary = typeof body.termsSummary === "string"
    ? body.termsSummary.trim()
    : "";
  const changeReason = body.changeReason.trim();
  const monthlyRentText = String(body.monthlyRent).trim();
  const monthlyRent = Number(body.monthlyRent);

  if (!isValidDate(startDate) || !isValidDate(endDate) || !isValidDate(renewalDate)) {
    return { error: "Dates must use the YYYY-MM-DD format" };
  }

  if (startDate > endDate) {
    return { error: "The rental start date must be before the end date" };
  }

  if (renewalDate < startDate || renewalDate > endDate) {
    return { error: "The renewal date must fall within the rental period" };
  }

  if (
    body.monthlyRent === "" ||
    body.monthlyRent === null ||
    body.monthlyRent === undefined ||
    !/^\d+(\.\d{1,2})?$/.test(monthlyRentText) ||
    !Number.isFinite(monthlyRent) ||
    monthlyRent < 0 ||
    monthlyRent > MAX_MONTHLY_RENT
  ) {
    return { error: "Monthly rent must be between 0 and 99,999,999.99" };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: "The agreement status is not valid" };
  }

  if (termsSummary.length > 500) {
    return { error: "The terms summary must be 500 characters or fewer" };
  }

  if (changeReason.length < 3 || changeReason.length > 250) {
    return { error: "A change reason between 3 and 250 characters is required" };
  }

  return {
    value: {
      startDate,
      endDate,
      monthlyRent,
      renewalDate,
      status,
      termsSummary,
      changeReason,
    },
  };
}

function validateAgreementUpdate(body) {
  const valuesValidation = validateAgreementValues(body);

  if (valuesValidation.error) {
    return valuesValidation;
  }

  if (typeof body.expectedUpdatedAt !== "string") {
    return { error: "Refresh the agreement before saving changes" };
  }

  const expectedUpdatedAt = new Date(body.expectedUpdatedAt);

  if (Number.isNaN(expectedUpdatedAt.getTime())) {
    return { error: "Refresh the agreement before saving changes" };
  }

  return {
    value: {
      ...valuesValidation.value,
      expectedUpdatedAt: expectedUpdatedAt.toISOString(),
    },
  };
}

function validateAgreementCreation(body) {
  const valuesValidation = validateAgreementValues(body);

  if (valuesValidation.error) {
    return valuesValidation;
  }

  if (typeof body.stallId !== "string") {
    return { error: "The stall ID must be a text value" };
  }

  if (typeof body.agreementReference !== "string") {
    return { error: "The agreement reference must be a text value" };
  }

  const stallId = body.stallId.trim();
  const agreementReference = body.agreementReference.trim();

  if (!isValidStallId(stallId)) {
    return { error: "The stall ID is not valid" };
  }

  if (agreementReference.length < 1 || agreementReference.length > 40) {
    return { error: "The agreement reference must be between 1 and 40 characters" };
  }

  return {
    value: {
      stallId,
      agreementReference,
      ...valuesValidation.value,
    },
  };
}

module.exports = {
  CURRENT_STATUSES,
  isValidAgreementId,
  validateAgreementCreation,
  validateAgreementUpdate,
};
