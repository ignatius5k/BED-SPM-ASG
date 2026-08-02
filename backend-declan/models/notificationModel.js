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
            SET IsRead = 'True'
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

async function createNotification(data){
    const connection = await sql.connect(dbConfig);

    const idResult = await connection.request().query(`
        SELECT RIGHT(MAX(NotificationID), 3) FROM Notifications
    `);

    const nextId = parseInt(idResult.recordset[0]['']) + 1;

    const notificationID = "N" + String(nextId).padStart(3, "0");

    const request = connection.request();

    request.input("NotificationID", notificationID);
    request.input("HawkerCentreID", data.CenterId);
    request.input("CustomerStallID", data.StallId);
    request.input("Message", data.Message);
    request.input("IsRead", data.IsRead);
    request.input("OrderID", data.OrderID);
    const vendorID = await request.query(`
        SELECT s.OwnerID
        FROM PublicStoreLinks p
        INNER JOIN Stalls s
            ON p.StallID = s.StallID
        WHERE p.HawkerCentreID = '069184'
        AND p.CustomerStallID = '01-05'
        AND p.isActive = 1;
    `)

    const result = await request.query(`
        INSERT INTO Notifications
        (NotificationID, VendorID, Message, IsRead, OrderID)
        VALUES (@NotificationID, '${vendorID.recordset[0].OwnerID}', @Message, @IsRead, @OrderID)
    `);

    return result;
}

module.exports = {
    getByVendor,
    markAsRead,
    deleteNotification,
    createNotification
};