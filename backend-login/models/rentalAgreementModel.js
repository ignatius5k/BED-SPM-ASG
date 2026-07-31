const sql = require("mssql");
const dbConfig = require("../dbConfig");
const { CURRENT_STATUSES } = require("../utils/rentalAgreementValidation");

function createModelError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createRequest(source) {
  return new sql.Request(source);
}

async function openConnection() {
  const connection = new sql.ConnectionPool(dbConfig);
  await connection.connect();
  return connection;
}

function formatDatabaseDate(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function formatHistoryValue(fieldName, value) {
  if (fieldName === "Monthly rent") {
    return `S$${Number(value).toFixed(2)}`;
  }

  return String(value || "");
}

function getAccessFilter(actorRole) {
  if (actorRole === "inspector") {
    return "";
  }

  if (actorRole === "vendor") {
    return "AND s.OwnerID = @actorId";
  }

  return "AND 1 = 0";
}

async function getAccessibleAgreement(source, actorId, actorRole, agreementId, lockAgreement) {
  const request = createRequest(source);
  request.input("actorId", sql.VarChar(10), actorId);
  request.input("agreementId", sql.VarChar(10), agreementId);

  const lockHint = lockAgreement ? "WITH (UPDLOCK, HOLDLOCK)" : "";
  const accessFilter = getAccessFilter(actorRole);

  const result = await request.query(`
    SELECT
      ra.AgreementID AS agreementId,
      ra.StallID AS stallId,
      s.StallName AS stallName,
      s.OwnerID AS vendorId,
      u.username AS vendorName,
      ra.AgreementReference AS agreementReference,
      ra.StartDate AS startDate,
      ra.EndDate AS endDate,
      ra.MonthlyRent AS monthlyRent,
      ra.RenewalDate AS renewalDate,
      ra.Status AS status,
      ra.TermsSummary AS termsSummary,
      ra.UpdatedAt AS updatedAt,
      DATEDIFF(DAY, CAST(GETDATE() AS DATE), ra.RenewalDate) AS daysUntilRenewal
    FROM RentalAgreements ra ${lockHint}
    INNER JOIN Stalls s ON ra.StallID = s.StallID
    INNER JOIN Users u ON s.OwnerID = u.id
    WHERE ra.AgreementID = @agreementId
      ${accessFilter};
  `);

  return result.recordset[0] || null;
}

async function lockStall(source, stallId) {
  const request = createRequest(source);
  request.input("stallId", sql.VarChar(10), stallId);

  await request.query(`
    SELECT StallID
    FROM Stalls WITH (UPDLOCK, HOLDLOCK)
    WHERE StallID = @stallId;
  `);
}

async function findOtherCurrentAgreement(source, stallId, agreementId) {
  const request = createRequest(source);
  request.input("stallId", sql.VarChar(10), stallId);
  request.input("agreementId", sql.VarChar(10), agreementId);

  const result = await request.query(`
    SELECT TOP 1 AgreementID AS agreementId
    FROM RentalAgreements WITH (UPDLOCK, HOLDLOCK)
    WHERE StallID = @stallId
      AND Status IN ('active', 'renewal due')
      AND AgreementID <> @agreementId;
  `);

  return result.recordset[0] || null;
}

async function updateRentalAgreement(actorId, actorRole, agreementId, agreementData) {
  let connection;
  let transaction;

  try {
    connection = await openConnection();

    const existingAgreement = await getAccessibleAgreement(
      connection,
      actorId,
      actorRole,
      agreementId,
      false
    );

    if (!existingAgreement) {
      return null;
    }

    transaction = new sql.Transaction(connection);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    await lockStall(transaction, existingAgreement.stallId);

    const currentAgreement = await getAccessibleAgreement(
      transaction,
      actorId,
      actorRole,
      agreementId,
      true
    );

    if (!currentAgreement) {
      await transaction.rollback();
      transaction = null;
      return null;
    }

    const currentUpdatedAt = new Date(currentAgreement.updatedAt).toISOString();

    if (currentUpdatedAt !== agreementData.expectedUpdatedAt) {
      throw createModelError(
        "STALE_AGREEMENT",
        "This agreement was changed by another user. Refresh it and try again"
      );
    }

    if (CURRENT_STATUSES.includes(agreementData.status)) {
      const otherCurrentAgreement = await findOtherCurrentAgreement(
        transaction,
        currentAgreement.stallId,
        agreementId
      );

      if (otherCurrentAgreement) {
        throw createModelError(
          "CURRENT_AGREEMENT_EXISTS",
          "This stall already has an active or renewal-due agreement"
        );
      }
    }

    const fields = [
      { property: "startDate", label: "Start date", oldValue: formatDatabaseDate(currentAgreement.startDate) },
      { property: "endDate", label: "End date", oldValue: formatDatabaseDate(currentAgreement.endDate) },
      { property: "monthlyRent", label: "Monthly rent", oldValue: Number(currentAgreement.monthlyRent) },
      { property: "renewalDate", label: "Renewal date", oldValue: formatDatabaseDate(currentAgreement.renewalDate) },
      { property: "status", label: "Status", oldValue: currentAgreement.status },
      { property: "termsSummary", label: "Terms summary", oldValue: currentAgreement.termsSummary || "" },
    ];

    const changedFields = fields.filter((field) => {
      return String(field.oldValue) !== String(agreementData[field.property]);
    });

    if (changedFields.length === 0) {
      await transaction.commit();
      transaction = null;

      return {
        agreement: currentAgreement,
        changesAdded: 0,
      };
    }

    const updateRequest = createRequest(transaction);
    updateRequest.input("actorId", sql.VarChar(10), actorId);
    updateRequest.input("agreementId", sql.VarChar(10), agreementId);
    updateRequest.input("startDate", sql.Date, agreementData.startDate);
    updateRequest.input("endDate", sql.Date, agreementData.endDate);
    updateRequest.input("monthlyRent", sql.Decimal(10, 2), agreementData.monthlyRent);
    updateRequest.input("renewalDate", sql.Date, agreementData.renewalDate);
    updateRequest.input("status", sql.VarChar(20), agreementData.status);
    updateRequest.input("termsSummary", sql.VarChar(500), agreementData.termsSummary);

    const accessFilter = getAccessFilter(actorRole);

    await updateRequest.query(`
      UPDATE ra
      SET
        StartDate = @startDate,
        EndDate = @endDate,
        MonthlyRent = @monthlyRent,
        RenewalDate = @renewalDate,
        Status = @status,
        TermsSummary = @termsSummary,
        UpdatedAt = CASE
          WHEN GETDATE() <= UpdatedAt THEN DATEADD(MILLISECOND, 1, UpdatedAt)
          ELSE GETDATE()
        END
      FROM RentalAgreements ra
      INNER JOIN Stalls s ON ra.StallID = s.StallID
      WHERE ra.AgreementID = @agreementId
        ${accessFilter};
    `);

    for (const field of changedFields) {
      const historyRequest = createRequest(transaction);
      historyRequest.input("agreementId", sql.VarChar(10), agreementId);
      historyRequest.input("changedBy", sql.VarChar(10), actorId);
      historyRequest.input("fieldChanged", sql.VarChar(50), field.label);
      historyRequest.input(
        "previousValue",
        sql.VarChar(500),
        formatHistoryValue(field.label, field.oldValue)
      );
      historyRequest.input(
        "newValue",
        sql.VarChar(500),
        formatHistoryValue(field.label, agreementData[field.property])
      );
      historyRequest.input("changeReason", sql.VarChar(250), agreementData.changeReason);

      await historyRequest.query(`
        INSERT INTO RentalAgreementChanges
          (AgreementID, ChangedBy, FieldChanged, PreviousValue, NewValue, ChangeReason)
        VALUES
          (@agreementId, @changedBy, @fieldChanged, @previousValue, @newValue, @changeReason);
      `);
    }

    await transaction.commit();
    transaction = null;

    const updatedAgreement = await getAccessibleAgreement(
      connection,
      actorId,
      actorRole,
      agreementId,
      false
    );

    return {
      agreement: updatedAgreement,
      changesAdded: changedFields.length,
    };
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Rental agreement rollback error:", rollbackError);
      }
    }

    if (
      error.code !== "CURRENT_AGREEMENT_EXISTS" &&
      error.code !== "STALE_AGREEMENT"
    ) {
      console.error("Database error in updateRentalAgreement:", error);
    }

    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  createModelError,
  createRequest,
  openConnection,
  getAccessibleAgreement,
  lockStall,
  findOtherCurrentAgreement,
  updateRentalAgreement,
};
