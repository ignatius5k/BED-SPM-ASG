const sql = require("mssql");
const dbConfig = require("../dbConfig");

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

async function getOwnedAgreement(connection, vendorId, agreementId) {
  const request = connection.request();
  request.input("vendorId", sql.VarChar(10), vendorId);
  request.input("agreementId", sql.VarChar(10), agreementId);

  const result = await request.query(`
    SELECT
      ra.AgreementID AS agreementId,
      ra.StallID AS stallId,
      s.StallName AS stallName,
      ra.AgreementReference AS agreementReference,
      ra.StartDate AS startDate,
      ra.EndDate AS endDate,
      ra.MonthlyRent AS monthlyRent,
      ra.RenewalDate AS renewalDate,
      ra.Status AS status,
      ra.TermsSummary AS termsSummary,
      ra.UpdatedAt AS updatedAt,
      DATEDIFF(DAY, CAST(GETDATE() AS DATE), ra.RenewalDate) AS daysUntilRenewal
    FROM RentalAgreements ra
    INNER JOIN Stalls s ON ra.StallID = s.StallID
    WHERE s.OwnerID = @vendorId
      AND ra.AgreementID = @agreementId;
  `);

  return result.recordset[0] || null;
}

async function getVendorRentalAgreements(vendorId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const stallRequest = connection.request();
    stallRequest.input("vendorId", sql.VarChar(10), vendorId);

    const stallResult = await stallRequest.query(`
      SELECT StallID AS stallId, StallName AS stallName
      FROM Stalls
      WHERE OwnerID = @vendorId
      ORDER BY StallName;
    `);

    if (stallResult.recordset.length === 0) {
      return null;
    }

    const agreementRequest = connection.request();
    agreementRequest.input("vendorId", sql.VarChar(10), vendorId);

    const agreementResult = await agreementRequest.query(`
      SELECT
        ra.AgreementID AS agreementId,
        ra.StallID AS stallId,
        s.StallName AS stallName,
        ra.AgreementReference AS agreementReference,
        ra.StartDate AS startDate,
        ra.EndDate AS endDate,
        ra.MonthlyRent AS monthlyRent,
        ra.RenewalDate AS renewalDate,
        ra.Status AS status,
        ra.TermsSummary AS termsSummary,
        ra.UpdatedAt AS updatedAt,
        DATEDIFF(DAY, CAST(GETDATE() AS DATE), ra.RenewalDate) AS daysUntilRenewal
      FROM RentalAgreements ra
      INNER JOIN Stalls s ON ra.StallID = s.StallID
      WHERE s.OwnerID = @vendorId
      ORDER BY
        CASE ra.Status
          WHEN 'renewal due' THEN 1
          WHEN 'active' THEN 2
          WHEN 'renewed' THEN 3
          ELSE 4
        END,
        ra.RenewalDate;
    `);

    const changeRequest = connection.request();
    changeRequest.input("vendorId", sql.VarChar(10), vendorId);

    const changeResult = await changeRequest.query(`
      SELECT
        rac.ChangeID AS changeId,
        rac.AgreementID AS agreementId,
        rac.FieldChanged AS fieldChanged,
        rac.PreviousValue AS previousValue,
        rac.NewValue AS newValue,
        rac.ChangeReason AS changeReason,
        rac.ChangedAt AS changedAt,
        u.username AS changedByName
      FROM RentalAgreementChanges rac
      INNER JOIN RentalAgreements ra ON rac.AgreementID = ra.AgreementID
      INNER JOIN Stalls s ON ra.StallID = s.StallID
      INNER JOIN Users u ON rac.ChangedBy = u.id
      WHERE s.OwnerID = @vendorId
      ORDER BY rac.ChangedAt DESC, rac.ChangeID DESC;
    `);

    return {
      stalls: stallResult.recordset,
      agreements: agreementResult.recordset,
      changes: changeResult.recordset,
    };
  } catch (error) {
    console.error("Database error in getVendorRentalAgreements:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function updateVendorRentalAgreement(vendorId, agreementId, agreementData) {
  let connection;
  let transaction;

  try {
    connection = await sql.connect(dbConfig);
    const currentAgreement = await getOwnedAgreement(
      connection,
      vendorId,
      agreementId
    );

    if (!currentAgreement) {
      return null;
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
      return {
        agreement: currentAgreement,
        changesAdded: 0,
      };
    }

    transaction = new sql.Transaction(connection);
    await transaction.begin();

    const updateRequest = new sql.Request(transaction);
    updateRequest.input("vendorId", sql.VarChar(10), vendorId);
    updateRequest.input("agreementId", sql.VarChar(10), agreementId);
    updateRequest.input("startDate", sql.Date, agreementData.startDate);
    updateRequest.input("endDate", sql.Date, agreementData.endDate);
    updateRequest.input("monthlyRent", sql.Decimal(10, 2), agreementData.monthlyRent);
    updateRequest.input("renewalDate", sql.Date, agreementData.renewalDate);
    updateRequest.input("status", sql.VarChar(20), agreementData.status);
    updateRequest.input("termsSummary", sql.VarChar(500), agreementData.termsSummary);

    await updateRequest.query(`
      UPDATE ra
      SET
        StartDate = @startDate,
        EndDate = @endDate,
        MonthlyRent = @monthlyRent,
        RenewalDate = @renewalDate,
        Status = @status,
        TermsSummary = @termsSummary,
        UpdatedAt = GETDATE()
      FROM RentalAgreements ra
      INNER JOIN Stalls s ON ra.StallID = s.StallID
      WHERE ra.AgreementID = @agreementId
        AND s.OwnerID = @vendorId;
    `);

    for (const field of changedFields) {
      const historyRequest = new sql.Request(transaction);
      historyRequest.input("agreementId", sql.VarChar(10), agreementId);
      historyRequest.input("changedBy", sql.VarChar(10), vendorId);
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
      historyRequest.input(
        "changeReason",
        sql.VarChar(250),
        agreementData.changeReason
      );

      await historyRequest.query(`
        INSERT INTO RentalAgreementChanges
          (AgreementID, ChangedBy, FieldChanged, PreviousValue, NewValue, ChangeReason)
        VALUES
          (@agreementId, @changedBy, @fieldChanged, @previousValue, @newValue, @changeReason);
      `);
    }

    await transaction.commit();
    transaction = null;

    const updatedAgreement = await getOwnedAgreement(
      connection,
      vendorId,
      agreementId
    );

    return {
      agreement: updatedAgreement,
      changesAdded: changedFields.length,
    };
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error("Database error in updateVendorRentalAgreement:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getVendorRentalAgreements,
  updateVendorRentalAgreement,
};
