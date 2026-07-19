const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllStalls() {
    const connection = await sql.connect(dbConfig);

    const result = await connection.request().query(`
        SELECT
            StallID,
            StallName
        FROM Stalls
        ORDER BY StallName
    `);

    return result.recordset;
}

module.exports = {
    getAllStalls
};