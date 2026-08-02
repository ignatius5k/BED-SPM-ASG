const sql = require("mssql");
const dbConfig = require("../../backend-login/dbConfig");

async function getVendorOrderHistory(vendorId) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    const request = connection.request();
    request.input("VendorID", sql.VarChar(20), vendorId);

    const result = await request.query(`
      SELECT
        o.OrderID,
        o.CustomerID,
        o.StallID,
        o.OrderDate,
        o.Status,
        o.TotalAmount
      FROM Orders o
      INNER JOIN Stalls s
        ON o.StallID = s.StallID
      WHERE s.OwnerID = @VendorID
      ORDER BY o.OrderDate DESC;
    `);

    return result.recordset;

  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function updateOrderStatus(orderId, status) {

    const connection = await sql.connect(dbConfig);

    const request = connection.request();

    request.input("OrderID", sql.VarChar(20), orderId);
    request.input("Status", sql.VarChar(20), status);

    await request.query(`
        UPDATE Orders
        SET Status = @Status
        WHERE OrderID = @OrderID
    `);

    connection.close();
}

module.exports = {
  getVendorOrderHistory,
  updateOrderStatus
};