const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getSalesAnalytics() {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    // STEP 1: Rank menu items using paid and completed orders only.
    const popularResult = await connection.request().query(`
      SELECT TOP 5
        mi.MenuItemID AS menuItemId,
        mi.ItemName AS itemName,
        mi.Price AS price,
        s.StallID AS stallId,
        s.StallName AS stallName,
        s.Cuisine AS cuisine,
        SUM(oi.Quantity) AS quantitySold,
        CAST(SUM(oi.Quantity * oi.UnitPrice) AS DECIMAL(10, 2)) AS revenue
      FROM OrderItems oi
      INNER JOIN Orders o ON oi.OrderID = o.OrderID
      INNER JOIN MenuItems mi ON oi.MenuItemID = mi.MenuItemID
      INNER JOIN Stalls s ON mi.StallID = s.StallID
      WHERE o.Status IN ('paid', 'completed')
        AND mi.IsAvailable = 1
      GROUP BY
        mi.MenuItemID,
        mi.ItemName,
        mi.Price,
        s.StallID,
        s.StallName,
        s.Cuisine
      ORDER BY quantitySold DESC, revenue DESC, itemName;
    `);

    // STEP 2: Count orders for each hour so customers can plan their visit.
    const peakResult = await connection.request().query(`
      SELECT
        DATEPART(HOUR, OrderDate) AS hourOfDay,
        COUNT(OrderID) AS totalOrders,
        CAST(SUM(TotalAmount) AS DECIMAL(10, 2)) AS totalSales
      FROM Orders
      WHERE Status IN ('paid', 'completed')
      GROUP BY DATEPART(HOUR, OrderDate)
      ORDER BY hourOfDay;
    `);

    // STEP 3: Find the hour with the highest order count using a normal loop.
    let busiestHour = null;

    for (let i = 0; i < peakResult.recordset.length; i += 1) {
      const currentHour = peakResult.recordset[i];

      if (
        busiestHour === null ||
        currentHour.totalOrders > busiestHour.totalOrders
      ) {
        busiestHour = currentHour;
      }
    }

    return {
      popularItems: popularResult.recordset,
      peakHours: peakResult.recordset,
      busiestHour: busiestHour,
    };
  } catch (error) {
    console.error("Database error in getSalesAnalytics:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getSalesAnalytics,
};
