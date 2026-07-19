const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getVendorPerformance(vendorId, dateFilter = null) {
  let connection;

  try {
    connection = await sql.connect(dbConfig);

    // STEP 1: Find the stalls that belong to the logged-in vendor.
    const stallRequest = connection.request();
    stallRequest.input("vendorId", sql.VarChar(10), vendorId);

    const stallResult = await stallRequest.query(`
      SELECT
        StallID AS stallId,
        StallName AS stallName
      FROM Stalls
      WHERE OwnerID = @vendorId
      ORDER BY StallName;
    `);

    if (stallResult.recordset.length === 0) {
      return null;
    }

    // STEP 2: Calculate today's sales, order count, and average order value.
    const summaryRequest = connection.request();
    summaryRequest.input("vendorId", sql.VarChar(10), vendorId);

    const summaryResult = await summaryRequest.query(`
      SELECT
        CAST(COALESCE(SUM(
          CASE
            WHEN CAST(o.OrderDate AS DATE) = CAST(GETDATE() AS DATE)
              AND o.Status IN ('paid', 'completed')
            THEN o.TotalAmount
            ELSE 0
          END
        ), 0) AS DECIMAL(10, 2)) AS dailySales,
        COUNT(
          CASE
            WHEN CAST(o.OrderDate AS DATE) = CAST(GETDATE() AS DATE)
              AND o.Status IN ('paid', 'completed')
            THEN 1
          END
        ) AS totalOrders,
        CAST(COALESCE(AVG(
          CASE
            WHEN CAST(o.OrderDate AS DATE) = CAST(GETDATE() AS DATE)
              AND o.Status IN ('paid', 'completed')
            THEN o.TotalAmount
          END
        ), 0) AS DECIMAL(10, 2)) AS averageOrderValue
      FROM Stalls s
      LEFT JOIN Orders o ON s.StallID = o.StallID
      WHERE s.OwnerID = @vendorId;
    `);

    // STEP 3: Group paid orders by week or month for the two charts.
    const trendRequest = connection.request();
    trendRequest.input("vendorId", sql.VarChar(10), vendorId);

    let trendDateCondition = `
      AND o.OrderDate >= DATEADD(
        MONTH,
        -6,
        DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
      )
      AND o.OrderDate < DATEADD(
        MONTH,
        1,
        DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
      )
    `;

    if (dateFilter) {
      trendRequest.input("startDate", sql.Date, dateFilter.startDate);
      trendRequest.input("endDate", sql.Date, dateFilter.endDate);
      trendDateCondition = `
        AND CAST(o.OrderDate AS DATE) >= @startDate
        AND CAST(o.OrderDate AS DATE) <= @endDate
      `;
    }

    let trendResult;

    if (dateFilter && dateFilter.granularity === "week") {
      trendResult = await trendRequest.query(`
        WITH WeeklyOrders AS (
          SELECT
            DATEDIFF(
              DAY,
              @startDate,
              CAST(o.OrderDate AS DATE)
            ) / 7 AS weekNumber,
            o.OrderID,
            o.TotalAmount
          FROM Stalls s
          INNER JOIN Orders o ON s.StallID = o.StallID
          WHERE s.OwnerID = @vendorId
            AND o.Status IN ('paid', 'completed')
            ${trendDateCondition}
        )
        SELECT
          DATEADD(DAY, weekNumber * 7, @startDate) AS monthStart,
          FORMAT(
            DATEADD(DAY, weekNumber * 7, @startDate),
            'd MMM'
          ) + ' - ' + FORMAT(
            CASE
              WHEN DATEADD(DAY, weekNumber * 7 + 6, @startDate) > @endDate
              THEN @endDate
              ELSE DATEADD(DAY, weekNumber * 7 + 6, @startDate)
            END,
            'd MMM'
          ) AS monthLabel,
          COUNT(OrderID) AS totalOrders,
          CAST(SUM(TotalAmount) AS DECIMAL(10, 2)) AS revenue
        FROM WeeklyOrders
        GROUP BY weekNumber
        ORDER BY monthStart;
      `);
    } else {
      trendResult = await trendRequest.query(`
        SELECT
          DATEFROMPARTS(YEAR(o.OrderDate), MONTH(o.OrderDate), 1) AS monthStart,
          FORMAT(o.OrderDate, 'MMM yyyy') AS monthLabel,
          COUNT(o.OrderID) AS totalOrders,
          CAST(SUM(o.TotalAmount) AS DECIMAL(10, 2)) AS revenue
        FROM Stalls s
        INNER JOIN Orders o ON s.StallID = o.StallID
        WHERE s.OwnerID = @vendorId
          AND o.Status IN ('paid', 'completed')
          ${trendDateCondition}
        GROUP BY
          YEAR(o.OrderDate),
          MONTH(o.OrderDate),
          FORMAT(o.OrderDate, 'MMM yyyy')
        ORDER BY monthStart;
      `);
    }

    // STEP 4: Rank every menu item using quantities from completed orders.
    const itemRequest = connection.request();
    itemRequest.input("vendorId", sql.VarChar(10), vendorId);

    const itemResult = await itemRequest.query(`
      SELECT
        mi.MenuItemID AS menuItemId,
        mi.ItemName AS itemName,
        COALESCE(SUM(
          CASE
            WHEN o.Status IN ('paid', 'completed') THEN oi.Quantity
            ELSE 0
          END
        ), 0) AS quantitySold,
        CAST(COALESCE(SUM(
          CASE
            WHEN o.Status IN ('paid', 'completed')
            THEN oi.Quantity * oi.UnitPrice
            ELSE 0
          END
        ), 0) AS DECIMAL(10, 2)) AS revenue
      FROM Stalls s
      INNER JOIN MenuItems mi ON s.StallID = mi.StallID
      LEFT JOIN OrderItems oi ON mi.MenuItemID = oi.MenuItemID
      LEFT JOIN Orders o ON oi.OrderID = o.OrderID
      WHERE s.OwnerID = @vendorId
      GROUP BY mi.MenuItemID, mi.ItemName
      ORDER BY quantitySold DESC, revenue DESC, itemName;
    `);

    const items = itemResult.recordset;

    return {
      stalls: stallResult.recordset,
      summary: summaryResult.recordset[0],
      monthly: trendResult.recordset,
      items: items,
      bestSellingItem: items.length > 0 ? items[0] : null,
      leastSellingItem: items.length > 0 ? items[items.length - 1] : null,
    };
  } catch (error) {
    console.error("Database error in getVendorPerformance:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = {
  getVendorPerformance,
};
