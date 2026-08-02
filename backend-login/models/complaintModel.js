const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function openConnection() {
  const connection = new sql.ConnectionPool(dbConfig);
  return connection.connect();
}

async function findPublicStall(connection, centreId, customerStallId) {
  const request = connection.request();
  request.input("centreId", sql.VarChar(10), centreId);
  request.input("customerStallId", sql.VarChar(20), customerStallId);

  const result = await request.query(`
    SELECT TOP (1)
      s.StallID AS stallId,
      s.StallName AS stallName
    FROM PublicStoreLinks publicStore
    INNER JOIN Stalls s
      ON publicStore.StallID = s.StallID
    WHERE publicStore.HawkerCentreID = @centreId
      AND publicStore.CustomerStallID = @customerStallId
      AND publicStore.IsActive = 1;
  `);

  return result.recordset[0] || null;
}

async function createComplaint(customerId, complaintData) {
  let connection;

  try {
    connection = await openConnection();
    const stall = await findPublicStall(
      connection,
      complaintData.centreId,
      complaintData.customerStallId
    );

    if (!stall) {
      return null;
    }

    const request = connection.request();
    request.input("customerId", sql.VarChar(10), customerId);
    request.input("stallId", sql.VarChar(10), stall.stallId);
    request.input("category", sql.VarChar(50), complaintData.category);
    request.input("description", sql.VarChar(500), complaintData.description);

    const result = await request.query(`
      INSERT INTO Complaints
        (customer_id, stall_id, category, description)
      OUTPUT
        INSERTED.complaint_id AS complaintId,
        INSERTED.customer_id AS customerId,
        INSERTED.stall_id AS stallId,
        INSERTED.category AS category,
        INSERTED.description AS description,
        INSERTED.status AS status,
        INSERTED.complaint_date AS complaintDate
      VALUES
        (@customerId, @stallId, @category, @description);
    `);

    return {
      ...result.recordset[0],
      stallName: stall.stallName,
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  createComplaint,
};
