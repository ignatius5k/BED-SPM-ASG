const sql = require("mssql");
const { CURRENT_STATUSES } = require("../utils/rentalAgreementValidation");
const rentalAgreementModel = require("./rentalAgreementModel");

async function getInspectorRentalAgreements() {
  let connection;

  try {
    connection = await rentalAgreementModel.openConnection();

    const stallResult = await connection.request().query(`
      SELECT
        s.StallID AS stallId,
        s.StallName AS stallName,
        s.OwnerID AS vendorId,
        u.username AS vendorName
      FROM Stalls s
      INNER JOIN Users u ON s.OwnerID = u.id
      WHERE s.StallID NOT LIKE 'FBS%'
      ORDER BY s.StallName, u.username;
    `);

    const publicStallResult = await connection.request().query(`
      SELECT
        s.StallID AS stallId,
        s.StallName AS stallName,
        s.OwnerID AS vendorId,
        u.username AS vendorName,
        publicStore.HawkerCentreID AS centreId,
        publicStore.CustomerStallID AS customerStallId,
        CAST(
          CASE WHEN s.OwnerID LIKE 'FBV%' THEN 0 ELSE 1 END
          AS BIT
        ) AS agreementEligible
      FROM PublicStoreLinks publicStore
      INNER JOIN Stalls s ON publicStore.StallID = s.StallID
      INNER JOIN Users u ON s.OwnerID = u.id
      WHERE publicStore.IsActive = 1
      ORDER BY
        publicStore.HawkerCentreID,
        publicStore.CustomerStallID;
    `);

    const agreementResult = await connection.request().query(`
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
      FROM RentalAgreements ra
      INNER JOIN Stalls s ON ra.StallID = s.StallID
      INNER JOIN Users u ON s.OwnerID = u.id
      WHERE s.StallID NOT LIKE 'FBS%'
      ORDER BY
        CASE ra.Status
          WHEN 'renewal due' THEN 1
          WHEN 'active' THEN 2
          WHEN 'renewed' THEN 3
          ELSE 4
        END,
        ra.RenewalDate,
        s.StallName;
    `);

    const changeResult = await connection.request().query(`
      SELECT
        rac.ChangeID AS changeId,
        rac.AgreementID AS agreementId,
        rac.FieldChanged AS fieldChanged,
        rac.PreviousValue AS previousValue,
        rac.NewValue AS newValue,
        rac.ChangeReason AS changeReason,
        rac.ChangedAt AS changedAt,
        u.username AS changedByName,
        u.role AS changedByRole
      FROM RentalAgreementChanges rac
      INNER JOIN RentalAgreements ra ON rac.AgreementID = ra.AgreementID
      INNER JOIN Stalls s ON ra.StallID = s.StallID
      INNER JOIN Users u ON rac.ChangedBy = u.id
      WHERE s.StallID NOT LIKE 'FBS%'
      ORDER BY rac.ChangedAt DESC, rac.ChangeID DESC;
    `);

    return {
      stalls: stallResult.recordset,
      publicStalls: publicStallResult.recordset,
      agreements: agreementResult.recordset,
      changes: changeResult.recordset,
    };
  } catch (error) {
    console.error("Database error in getInspectorRentalAgreements:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function getNextAgreementId(source) {
  const request = rentalAgreementModel.createRequest(source);

  const result = await request.query(`
    SELECT MAX(TRY_CONVERT(INT, SUBSTRING(AgreementID, 3, 8))) AS maxAgreementNumber
    FROM RentalAgreements WITH (UPDLOCK, HOLDLOCK)
    WHERE AgreementID LIKE 'RA%'
      AND TRY_CONVERT(INT, SUBSTRING(AgreementID, 3, 8)) IS NOT NULL;
  `);

  const nextNumber = Number(result.recordset[0].maxAgreementNumber || 0) + 1;
  const agreementId = `RA${String(nextNumber).padStart(3, "0")}`;

  if (agreementId.length > 10) {
    throw rentalAgreementModel.createModelError(
      "AGREEMENT_ID_LIMIT_REACHED",
      "No more rental agreement IDs are available"
    );
  }

  return agreementId;
}

async function getEligibleStall(source, stallId) {
  const request = rentalAgreementModel.createRequest(source);
  request.input("stallId", sql.VarChar(10), stallId);

  const result = await request.query(`
    SELECT
      s.StallID AS stallId,
      s.StallName AS stallName,
      s.OwnerID AS vendorId,
      u.username AS vendorName
    FROM Stalls s
    INNER JOIN Users u ON s.OwnerID = u.id
    WHERE s.StallID = @stallId
      AND s.StallID NOT LIKE 'FBS%';
  `);

  return result.recordset[0] || null;
}

async function agreementReferenceExists(source, agreementReference) {
  const request = rentalAgreementModel.createRequest(source);
  request.input("agreementReference", sql.VarChar(40), agreementReference);

  const result = await request.query(`
    SELECT TOP 1 AgreementID AS agreementId
    FROM RentalAgreements WITH (UPDLOCK, HOLDLOCK)
    WHERE AgreementReference = @agreementReference;
  `);

  return Boolean(result.recordset[0]);
}

async function createInspectorRentalAgreement(inspectorId, agreementData) {
  let connection;
  let transaction;

  try {
    connection = await rentalAgreementModel.openConnection();
    transaction = new sql.Transaction(connection);
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    await rentalAgreementModel.lockStall(transaction, agreementData.stallId);

    const stall = await getEligibleStall(transaction, agreementData.stallId);

    if (!stall) {
      throw rentalAgreementModel.createModelError(
        "STALL_NOT_FOUND",
        "The selected stall was not found"
      );
    }

    if (await agreementReferenceExists(transaction, agreementData.agreementReference)) {
      throw rentalAgreementModel.createModelError(
        "AGREEMENT_REFERENCE_EXISTS",
        "That agreement reference is already in use"
      );
    }

    if (CURRENT_STATUSES.includes(agreementData.status)) {
      const otherCurrentAgreement = await rentalAgreementModel.findOtherCurrentAgreement(
        transaction,
        agreementData.stallId,
        ""
      );

      if (otherCurrentAgreement) {
        throw rentalAgreementModel.createModelError(
          "CURRENT_AGREEMENT_EXISTS",
          "This stall already has an active or renewal-due agreement"
        );
      }
    }

    const agreementId = await getNextAgreementId(transaction);
    const insertRequest = rentalAgreementModel.createRequest(transaction);
    insertRequest.input("agreementId", sql.VarChar(10), agreementId);
    insertRequest.input("stallId", sql.VarChar(10), agreementData.stallId);
    insertRequest.input("agreementReference", sql.VarChar(40), agreementData.agreementReference);
    insertRequest.input("startDate", sql.Date, agreementData.startDate);
    insertRequest.input("endDate", sql.Date, agreementData.endDate);
    insertRequest.input("monthlyRent", sql.Decimal(10, 2), agreementData.monthlyRent);
    insertRequest.input("renewalDate", sql.Date, agreementData.renewalDate);
    insertRequest.input("status", sql.VarChar(20), agreementData.status);
    insertRequest.input("termsSummary", sql.VarChar(500), agreementData.termsSummary);

    await insertRequest.query(`
      INSERT INTO RentalAgreements
        (AgreementID, StallID, AgreementReference, StartDate, EndDate,
         MonthlyRent, RenewalDate, Status, TermsSummary)
      VALUES
        (@agreementId, @stallId, @agreementReference, @startDate, @endDate,
         @monthlyRent, @renewalDate, @status, @termsSummary);
    `);

    const historyRequest = rentalAgreementModel.createRequest(transaction);
    historyRequest.input("agreementId", sql.VarChar(10), agreementId);
    historyRequest.input("changedBy", sql.VarChar(10), inspectorId);
    historyRequest.input("fieldChanged", sql.VarChar(50), "Agreement created");
    historyRequest.input("newValue", sql.VarChar(500), agreementData.agreementReference);
    historyRequest.input("changeReason", sql.VarChar(250), agreementData.changeReason);

    await historyRequest.query(`
      INSERT INTO RentalAgreementChanges
        (AgreementID, ChangedBy, FieldChanged, PreviousValue, NewValue, ChangeReason)
      VALUES
        (@agreementId, @changedBy, @fieldChanged, NULL, @newValue, @changeReason);
    `);

    await transaction.commit();
    transaction = null;

    const createdAgreement = await rentalAgreementModel.getAccessibleAgreement(
      connection,
      inspectorId,
      "inspector",
      agreementId,
      false
    );

    return createdAgreement;
  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Inspector rental agreement rollback error:", rollbackError);
      }
    }

    if (error.number === 2601 || error.number === 2627) {
      throw rentalAgreementModel.createModelError(
        "AGREEMENT_REFERENCE_EXISTS",
        "That agreement reference is already in use"
      );
    }

    const expectedErrorCodes = [
      "STALL_NOT_FOUND",
      "AGREEMENT_REFERENCE_EXISTS",
      "CURRENT_AGREEMENT_EXISTS",
      "AGREEMENT_ID_LIMIT_REACHED",
    ];

    if (!expectedErrorCodes.includes(error.code)) {
      console.error("Database error in createInspectorRentalAgreement:", error);
    }

    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function updateInspectorRentalAgreement(inspectorId, agreementId, agreementData) {
  return rentalAgreementModel.updateRentalAgreement(
    inspectorId,
    "inspector",
    agreementId,
    agreementData
  );
}

module.exports = {
  getInspectorRentalAgreements,
  createInspectorRentalAgreement,
  updateInspectorRentalAgreement,
};
