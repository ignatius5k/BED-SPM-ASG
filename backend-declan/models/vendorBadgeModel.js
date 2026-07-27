const sql = require("mssql");
const dbConfig = require("../../backend-login/dbConfig");

exports.getCounts = async (vendorId) => {
  let connection;

  try {
    connection = await new sql.ConnectionPool(dbConfig).connect();

    const notificationRequest = connection.request();
    notificationRequest.input("vendorId", sql.VarChar(10), vendorId);
    const notifications = await notificationRequest.query(`
      SELECT COUNT(*) AS count
      FROM Notifications
      WHERE VendorID = @vendorId
        AND IsRead = 'False'
    `);

    const complaintRequest = connection.request();
    complaintRequest.input("vendorId", sql.VarChar(10), vendorId);
    const complaints = await complaintRequest.query(`
      SELECT COUNT(*) AS count
      FROM Complaints c
      INNER JOIN Stalls s ON c.stall_id = s.StallID
      WHERE s.OwnerID = @vendorId
        AND c.status = 'pending'
    `);

    return {
      notifications: notifications.recordset[0].count,
      complaints: complaints.recordset[0].count
    };
  } finally {
    if (connection) await connection.close();
  }
};
