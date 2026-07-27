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

async function getVendorInspectionHistory(vendorId, months, selectedStallId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    // STEP 1: Find only stalls owned by the logged-in vendor.
    const stallRequest = connection.request();
    stallRequest.input("vendorId", sql.VarChar(10), vendorId);

    const stallResult = await stallRequest.query(`
      SELECT StallID AS stallId, StallName AS stallName
      FROM Stalls
      WHERE OwnerID = @vendorId
      ORDER BY StallName;
    `);

    const stalls = stallResult.recordset;

    if (stalls.length === 0) {
      return null;
    }

    // STEP 2: Use the requested stall only when this vendor owns it.
    let stallId = selectedStallId;

    if (!stallId) {
      stallId = stalls[0].stallId;
    }

    const ownsSelectedStall = stalls.some((stall) => {
      return stall.stallId === stallId;
    });

    if (!ownsSelectedStall) {
      return { invalidStall: true };
    }

    // STEP 3: Retrieve the selected stall's inspection records.
    // @vendorId is checked again in this query to preserve vendor isolation.
    const inspectionRequest = connection.request();
    inspectionRequest.input("vendorId", sql.VarChar(10), vendorId);
    inspectionRequest.input("stallId", sql.VarChar(10), stallId);
    inspectionRequest.input("months", sql.Int, months);

    const inspectionResult = await inspectionRequest.query(`
      SELECT
        i.InspectionID AS inspectionId,
        i.StallID AS stallId,
        s.StallName AS stallName,
        i.InspectionDate AS inspectionDate,
        i.CleanlinessScore AS cleanlinessScore,
        i.FoodHandlingScore AS foodHandlingScore,
        i.Remarks AS remarks,
        i.Grade AS grade,
        u.username AS inspectorName
      FROM Inspections i
      INNER JOIN Stalls s ON i.StallID = s.StallID
      INNER JOIN Users u ON i.InspectorID = u.id
      WHERE s.OwnerID = @vendorId
        AND i.StallID = @stallId
        AND (
          @months = 0
          OR i.InspectionDate >= DATEADD(MONTH, 0 - @months, CAST(GETDATE() AS DATE))
        )
      ORDER BY i.InspectionDate, i.InspectionID;
    `);

    const inspections = inspectionResult.recordset.map((inspection) => {
      return {
        ...inspection,
        inspectionDate: formatDatabaseDate(inspection.inspectionDate),
      };
    });

    return {
      stalls: stalls,
      selectedStallId: stallId,
      periodMonths: months,
      inspections: inspections,
    };
  } catch (error) {
    console.error("Database error in getVendorInspectionHistory:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getVendorInspectionHistory,
};
