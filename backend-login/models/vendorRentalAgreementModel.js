const sql = require("mssql");
const rentalAgreementModel = require("./rentalAgreementModel");

async function getVendorRentalAgreements(vendorId) {
  let connection;

  try {
    connection = await rentalAgreementModel.openConnection();

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
        u.username AS changedByName,
        u.role AS changedByRole
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
  return rentalAgreementModel.updateRentalAgreement(
    vendorId,
    "vendor",
    agreementId,
    agreementData
  );
}

module.exports = {
  getVendorRentalAgreements,
  updateVendorRentalAgreement,
};
