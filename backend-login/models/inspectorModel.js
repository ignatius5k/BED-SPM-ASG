const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getAllInspectors() {

    const connection = await sql.connect(dbConfig);

    const result = await connection.request().query(`

        SELECT

            id,
            username

        FROM Users

        WHERE role = 'inspector'

        ORDER BY username

    `);

    return result.recordset;

}

module.exports = {
    getAllInspectors
};