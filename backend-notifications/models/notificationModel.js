const sql = require("mssql");
const dbConfig = require("../../backend-login/dbConfig");

async function getByVendor(vendorId) {
    const connection = await sql.connect(dbConfig);

    const result = await connection.request()
        .input("vendorId", sql.VarChar, vendorId)
        .query(`
            SELECT *
            FROM Notifications
            WHERE VendorID = @vendorId
            ORDER BY CreatedAt DESC
        `);

    return result.recordset;
}

async function markAsRead(id) {
    const connection = await sql.connect(dbConfig);

    await connection.request()
        .input("id", sql.VarChar, id)
        .query(`
            UPDATE Notifications
            SET IsRead = 1
            WHERE NotificationID = @id
        `);
}

async function deleteNotification(id) {
    const connection = await sql.connect(dbConfig);

    await connection.request()
        .input("id", sql.VarChar, id)
        .query(`
            DELETE FROM Notifications
            WHERE NotificationID = @id
        `);
}

module.exports = {
    getByVendor,
    markAsRead,
    deleteNotification
};