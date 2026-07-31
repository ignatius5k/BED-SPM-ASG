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
  const startDate = String(body.startDate || "").trim();
  const endDate = String(body.endDate || "").trim();
  const renewalDate = String(body.renewalDate || "").trim();
  const status = String(body.status || "").trim().toLowerCase();
  const termsSummary = String(body.termsSummary || "").trim();
  const changeReason = String(body.changeReason || "").trim();
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
  return validateAgreementValues(body || {});
}

function validateAgreementCreation(body) {
  const valuesValidation = validateAgreementValues(body || {});

  if (valuesValidation.error) {
    return valuesValidation;
  }

  const stallId = String(body.stallId || "").trim();
  const agreementReference = String(body.agreementReference || "").trim();

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
