const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllStalls() {
    const connection = await sql.connect(dbConfig);

    const result = await connection.request().query(`
        SELECT
            StallID,
            StallName
        FROM Stalls
        WHERE StallID NOT LIKE 'FBS%'
        ORDER BY StallName
    `);

    return result.recordset;
}

async function getPublicStalls() {
    const connection = await sql.connect(dbConfig);

    const result = await connection.request().query(`
        SELECT
            s.StallID,
            s.StallName,
            publicStore.HawkerCentreID,
            publicStore.CustomerStallID
        FROM PublicStoreLinks publicStore
        INNER JOIN Stalls s
            ON publicStore.StallID = s.StallID
        WHERE publicStore.IsActive = 1
        ORDER BY
            publicStore.HawkerCentreID,
            publicStore.CustomerStallID
    `);

    return result.recordset;
}

module.exports = {
    getAllStalls,
    getPublicStalls
};
